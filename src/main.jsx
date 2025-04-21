import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import './index.css';
import { store } from './store/store';
import { Buffer } from 'buffer';

// Set Buffer polyfill
window.Buffer = Buffer;

// Custom toast styles
import './toast.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        {/* React Hot Toast for WalletConnect */}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
        {/* React Toastify for other notifications */}
        <ToastContainer
          position="bottom-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          limit={3}
          className="small-toast"
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);