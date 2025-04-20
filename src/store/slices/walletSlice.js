import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  publicKey: null,
  isConnected: false,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletPublicKey: (state, action) => {
      state.publicKey = action.payload;
      state.isConnected = !!action.payload;
    },
  },
});

export const { setWalletPublicKey } = walletSlice.actions;

export const selectWalletPublicKey = (state) => state.wallet.publicKey;
export const selectIsWalletConnected = (state) => state.wallet.isConnected;

export default walletSlice.reducer; 