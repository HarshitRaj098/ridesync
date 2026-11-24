import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CURRENT_USER } from '../../data/mockData';

export interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; initials: string; email: string } | null;
  mode: 'login' | 'register';
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  mode: 'login',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setMode(state, action: PayloadAction<'login' | 'register'>) {
      state.mode = action.payload;
    },
    /** Mock sign-in — TODO: replace with api/authService + real JWT. */
    signIn(state, action: PayloadAction<{ name: string; email: string }>) {
      state.isAuthenticated = true;
      state.user = {
        id: CURRENT_USER.id,
        name: action.payload.name || CURRENT_USER.name,
        initials: CURRENT_USER.initials,
        email: action.payload.email,
      };
    },
    signOut(state) {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const { setMode, signIn, signOut } = authSlice.actions;
export default authSlice.reducer;
