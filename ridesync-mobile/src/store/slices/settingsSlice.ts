import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  darkMode: boolean;
  notificationsEnabled: boolean;
  locationSharing: boolean;
  voiceEnabled: boolean;
  units: 'metric' | 'imperial';
}

const initialState: SettingsState = {
  darkMode: true,
  notificationsEnabled: true,
  locationSharing: true,
  voiceEnabled: true,
  units: 'metric',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggle(state, action: PayloadAction<keyof Omit<SettingsState, 'units'>>) {
      const key = action.payload;
      (state[key] as boolean) = !(state[key] as boolean);
    },
    setUnits(state, action: PayloadAction<'metric' | 'imperial'>) {
      state.units = action.payload;
    },
  },
});

export const { toggle, setUnits } = settingsSlice.actions;
export default settingsSlice.reducer;
