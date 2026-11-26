import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialsFor } from '../../data/mockData';

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
    /**
     * Local sign-in — there is no backend yet, so the signed-in user is
     * whoever the user typed in (name + email), stored only on this
     * device for this session. No fake person is ever substituted.
     * TODO: replace with api/authService + real JWT.
     */
    signIn(state, action: PayloadAction<{ name: string; email: string }>) {
      const name = action.payload.name.trim();
      state.isAuthenticated = true;
      state.user = {
        id: 'local-user',
        name,
        initials: initialsFor(name),
        email: action.payload.email.trim(),
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
