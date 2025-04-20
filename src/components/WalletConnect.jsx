import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setWalletPublicKey } from '../store/slices/walletSlice';

function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const dispatch = useDispatch();
  
  // Check for existing wallet connection on component mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // First check localStorage for existing connection
        const savedWalletAddress = localStorage.getItem('walletPublicKey');
        
        if (savedWalletAddress) {
          // We have a saved connection, restore it
          handleSuccessfulConnection(savedWalletAddress, true);
          return;
        }
        
        // Check if Phantom is installed
        if (!window.ethereum?.isPhantom) return;
        
        // Get any existing accounts
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          const walletAddress = accounts[0];
          handleSuccessfulConnection(walletAddress);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };
    
    // Small delay to ensure DOM is fully loaded
    setTimeout(checkExistingConnection, 500);
    
    // Add event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('connect', () => {
        console.log('Wallet connected event fired');
      });
      window.ethereum.on('disconnect', () => {
        console.log('Wallet disconnected event fired');
        handleDisconnect();
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('connect', () => {});
        window.ethereum.removeListener('disconnect', () => {});
      }
    };
  }, []);
  
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      handleDisconnect();
    } else {
      // Account changed, update to the new one
      handleSuccessfulConnection(accounts[0]);
    }
  };
  
  const handleSuccessfulConnection = (address, isSilent = false) => {
    setPublicKey(address);
    setIsConnected(true);
    setIsConnecting(false);
    dispatch(setWalletPublicKey(address));
    
    if (!isSilent) {
      toast.success('Wallet connected successfully!');
    }
    
    // Dispatch a custom event that other components can listen for
    const event = new CustomEvent('walletConnected', { detail: { address } });
    window.dispatchEvent(event);
    
    // Save to localStorage for persistence - use consistent key names
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletPublicKey', address);
  };
  
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const connectingToast = toast.loading('Connecting to wallet...');
      
      // Check if Phantom is installed
      if (!window.ethereum) {
        toast.dismiss(connectingToast);
        toast.error('No wallet detected! Please install Phantom wallet extension.');
        setIsConnecting(false);
        return;
      }
      
      // Request connection
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Dismiss the connecting toast
      toast.dismiss(connectingToast);
      
      if (accounts && accounts.length > 0) {
        handleSuccessfulConnection(accounts[0]);
      } else {
        toast.error('Failed to connect. No accounts were provided.');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Connection failed: ${error.message || 'Unknown error'}`);
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = () => {
    setPublicKey(null);
    setIsConnected(false);
    dispatch(setWalletPublicKey(null));
    toast.success('Wallet disconnected');
    
    // Dispatch a custom event for wallet disconnected
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
    
    // Clear from localStorage - use consistent key names
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletPublicKey');
    localStorage.removeItem('ongoingGame'); // Clear any ongoing game
  };
  
  return (
    <div className="flex items-center space-x-2">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isConnecting 
              ? 'bg-gray-500 cursor-wait' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white`}
          aria-label="Connect wallet"
          tabIndex="0"
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
        >
          {isConnecting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect Wallet'
          )}
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <button
            className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-medium hover:bg-indigo-200 transition-all"
            aria-label={`Wallet address: ${publicKey}`}
            tabIndex="0"
          >
            {`${publicKey?.slice(0, 6)}...${publicKey?.slice(-4)}`}
          </button>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium hover:bg-red-200 transition-all"
            aria-label="Disconnect wallet"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && handleDisconnect()}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
