import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet } from 'lucide-react';

// Local storage keys
const WALLET_ADDRESS_KEY = 'walletAddress';
const AUTH_TOKEN_KEY = 'authToken';

// Generate a random nonce for message signing
const generateNonce = () => {
  return `Authentication request ${Math.floor(Math.random() * 1000000)}`;
};

const WalletConnect = () => {
  const [account, setAccount] = useState(() => {
    return localStorage.getItem(WALLET_ADDRESS_KEY) || '';
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  });

  const checkMetaMaskAvailability = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const connectWallet = async () => {
    if (!checkMetaMaskAvailability()) {
      setError('Please install MetaMask!');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');

      // Request MetaMask connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // First try to get existing accounts
      let accounts = await provider.listAccounts();
      
      // If no accounts or not connected, request connection
      if (!accounts.length) {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
      }
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setAccount(address);
        localStorage.setItem(WALLET_ADDRESS_KEY, address);
        
        // Proceed with authentication after connection
        await authenticateWallet(address, provider);
      } else {
        throw new Error('No accounts found');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message === 'No accounts found' ? 'Please unlock MetaMask' : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        const address = accounts[0];
        setAccount(address);
        localStorage.setItem(WALLET_ADDRESS_KEY, address);
      } else {
        setAccount('');
        localStorage.removeItem(WALLET_ADDRESS_KEY);
      }
    };

    const initializeWallet = async () => {
      if (checkMetaMaskAvailability()) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          handleAccountsChanged(accounts);

          // Listen for account changes
          window.ethereum.on('accountsChanged', handleAccountsChanged);

          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        } catch (err) {
          console.error('Error initializing wallet:', err);
        }
      }
    };

    initializeWallet();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const authenticateWallet = async (address, provider) => {
    try {
      setIsSigning(true);
      const nonce = generateNonce();
      const signer = await provider.getSigner();
      
      // Sign the message
      const signature = await signer.signMessage(nonce);
      
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(nonce, signature);
      
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        // Create a simple auth token (in a real app, this would be a JWT from a backend)
        const authToken = btoa(`${address}:${Date.now()}`);
        localStorage.setItem(AUTH_TOKEN_KEY, authToken);
        setIsAuthenticated(true);
      } else {
        throw new Error('Signature verification failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Failed to authenticate wallet');
      setAccount('');
      localStorage.removeItem(WALLET_ADDRESS_KEY);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in-up z-50">
          {error}
        </div>
      )}
      
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all relative
            ${isConnecting
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white'}
          `}
        >
          <Wallet className="w-5 h-5" />
          {isConnecting ? 'Connecting...' : isSigning ? 'Authenticating...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-700 rounded-lg text-white relative group cursor-pointer">
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          <Wallet className="w-5 h-5" />
          <span className="font-medium">{shortenAddress(account)}</span>
          <button 
            onClick={async () => {
              try {
                // Clear all local state and storage
                setAccount('');
                setError('');
                setIsAuthenticated(false);
                localStorage.removeItem(WALLET_ADDRESS_KEY);
                localStorage.removeItem(AUTH_TOKEN_KEY);
                
                // Remove event listeners
                window.ethereum.removeListener('accountsChanged', () => {});
                
                // Clear MetaMask connection state
                await window.ethereum.request({
                  method: 'wallet_requestPermissions',
                  params: [{ eth_accounts: {} }],
                });
                
                // Force disconnect without reconnecting
                await window.ethereum.request({
                  method: 'eth_requestAccounts',
                  params: [],
                }).then(() => {
                  window.ethereum._state.accounts = [];
                });
              } catch (err) {
                console.error('Error disconnecting wallet:', err);
                setError('Failed to disconnect wallet');
              }
            }} 
            className="absolute left-0 top-full mt-1 w-full bg-purple-500 text-white py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 "
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;