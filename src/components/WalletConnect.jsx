import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { setWalletPublicKey, selectIsWalletConnected, selectWalletPublicKey } from '../store/slices/walletSlice';

function WalletConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const dispatch = useDispatch();
  
  // Get wallet state from Redux
  const isConnected = useSelector(selectIsWalletConnected);
  const publicKey = useSelector(selectWalletPublicKey);
  
  // Setup wallet event listeners
  useEffect(() => {
    // Handle request wallet connect events
    const handleRequestConnect = () => {
      if (!isConnected && !isConnecting) {
        handleConnect();
      }
    };
    
    window.addEventListener('requestWalletConnect', handleRequestConnect);
    
    return () => {
      window.removeEventListener('requestWalletConnect', handleRequestConnect);
    };
  }, [isConnected, isConnecting]);
  
  // Check for existing wallet connection on component mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // First check localStorage for existing connection
        const savedWalletAddress = localStorage.getItem('walletPublicKey');
        const savedWalletConnected = localStorage.getItem('walletConnected') === 'true';
        
        if (savedWalletAddress && savedWalletConnected) {
          console.log('Restoring saved wallet connection:', savedWalletAddress);
          // We have a saved connection, restore it
          dispatch(setWalletPublicKey(savedWalletAddress));
          
          // Verify that the Phantom wallet is still connected with this address
          if (window.solana?.isPhantom) {
            if (window.solana.isConnected) {
              const currentAddress = window.solana.publicKey.toString();
              // If addresses don't match, update to current one
              if (currentAddress !== savedWalletAddress) {
                console.log('Wallet address changed, updating to current one');
                dispatch(setWalletPublicKey(currentAddress));
                localStorage.setItem('walletPublicKey', currentAddress);
              }
            } else {
              // Phantom is installed but not connected - try to reconnect
              try {
                console.log('Attempting to reconnect to saved wallet');
                await window.solana.connect({ onlyIfTrusted: true });
                const currentAddress = window.solana.publicKey.toString();
                dispatch(setWalletPublicKey(currentAddress));
                localStorage.setItem('walletPublicKey', currentAddress);
              } catch (err) {
                // Silent fail for auto-reconnect
                console.log('Auto-reconnect failed, will require manual connection');
                handleDisconnect();
              }
            }
          }
          return;
        }
        
        // Check if Phantom is installed and available
        if (!window.solana?.isPhantom) {
          console.log('Phantom wallet not installed');
          return;
        }
        
        // Check if already connected
        if (window.solana.isConnected) {
          console.log('Phantom wallet already connected');
          const walletAddress = window.solana.publicKey.toString();
          dispatch(setWalletPublicKey(walletAddress));
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletPublicKey', walletAddress);
        }
      } catch (error) {
        console.error('Error checking Solana wallet connection:', error);
        // Reset connection state if there was an error
        handleDisconnect();
      }
    };
    
    // Small delay to ensure DOM is fully loaded
    setTimeout(checkExistingConnection, 500);
    
    // Add event listeners for wallet changes
    if (window.solana) {
      window.solana.on('connect', handleSolanaConnect);
      window.solana.on('disconnect', handleSolanaDisconnect);
      window.solana.on('accountChanged', handleSolanaAccountChanged);
    }
    
    return () => {
      // Clean up listeners
      if (window.solana) {
        window.solana.off('connect', handleSolanaConnect);
        window.solana.off('disconnect', handleSolanaDisconnect);
        window.solana.off('accountChanged', handleSolanaAccountChanged);
      }
    };
  }, [dispatch]);
  
  const handleSolanaConnect = () => {
    console.log('Solana connect event received');
    if (window.solana.publicKey) {
      const address = window.solana.publicKey.toString();
      dispatch(setWalletPublicKey(address));
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletPublicKey', address);
      
      // Dispatch custom event
      const event = new CustomEvent('walletConnected', { detail: { address } });
      window.dispatchEvent(event);
    }
  };
  
  const handleSolanaDisconnect = () => {
    console.log('Solana disconnect event received');
    handleDisconnect();
  };
  
  const handleSolanaAccountChanged = (publicKey) => {
    console.log('Solana account changed event received');
    if (publicKey) {
      const address = publicKey.toString();
      dispatch(setWalletPublicKey(address));
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletPublicKey', address);
      
      // Dispatch custom event
      const event = new CustomEvent('walletConnected', { detail: { address } });
      window.dispatchEvent(event);
    } else {
      handleDisconnect();
    }
  };
  
  const handleConnect = async () => {
    if (isConnecting || isConnected) return;
    
    try {
      setIsConnecting(true);
      const connectingToast = toast.loading('Connecting to wallet...');
      
      // Check if Phantom is installed
      if (!window.solana?.isPhantom) {
        toast.dismiss(connectingToast);
        toast.error('No Phantom wallet detected! Please install Phantom wallet extension.');
        window.open('https://phantom.app/', '_blank');
        setIsConnecting(false);
        return;
      }
      
      // Request Solana connection
      try {
        console.log('Requesting Phantom wallet connection');
        const { publicKey } = await window.solana.connect();
        
        // Dismiss the connecting toast
        toast.dismiss(connectingToast);
        
        if (publicKey) {
          const walletAddress = publicKey.toString();
          console.log('Connection successful, wallet address:', walletAddress);
          
          // Update Redux state
          dispatch(setWalletPublicKey(walletAddress));
          
          // Save to localStorage
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletPublicKey', walletAddress);
          
          // Show success toast
          toast.success('Wallet connected successfully!');
          
          // Dispatch custom event
          const event = new CustomEvent('walletConnected', { detail: { address: walletAddress } });
          window.dispatchEvent(event);
        } else {
          console.error('No public key returned from wallet');
          toast.error('Failed to connect. No public key was provided.');
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
        toast.dismiss(connectingToast);
        toast.error(`Connection rejected: ${err.message || 'User rejected the request'}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Connection failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      console.log('Disconnecting wallet');
      
      // Disconnect from Phantom if connected
      if (window.solana?.isPhantom && window.solana.isConnected) {
        await window.solana.disconnect();
      }
      
      // Update Redux state
      dispatch(setWalletPublicKey(null));
      
      // Show success toast
      toast.success('Wallet disconnected');
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
      
      // Clear from localStorage
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletPublicKey');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
      
      // Reset state anyway to ensure UI is consistent
      dispatch(setWalletPublicKey(null));
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletPublicKey');
    }
  };
  
  return (
    <div className="flex items-center space-x-2 w-full sm:w-auto">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-all ${
            isConnecting 
              ? 'bg-gray-500 cursor-wait' 
              : 'bg-purple-700 hover:bg-purple-600'
          } text-white`}
          aria-label="Connect wallet"
          tabIndex="0"
          data-action="connect-wallet"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 w-full">
          <div className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[140px]">
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full sm:w-auto text-xs sm:text-sm px-2 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all"
            aria-label="Disconnect wallet"
            tabIndex="0"
          >Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
