import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TRIP } from '../../data/mockData';

export interface TripState {
  currentTrip: typeof TRIP | null;
  joined: boolean;
  createdTripName: string;
}

const initialState: TripState = {
  currentTrip: TRIP,
  joined: false,
  createdTripName: TRIP.name,
};

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    /** Mock create — TODO: POST /api/trips via api/tripService. */
    createTrip(state, action: PayloadAction<{ name: string }>) {
      state.createdTripName = action.payload.name;
      state.joined = true;
    },
    /** Mock join — TODO: POST /api/trips/join { code } via api/tripService. */
    joinTrip(state, action: PayloadAction<{ code: string }>) {
      state.joined = true;
      state.currentTrip = { ...TRIP, code: action.payload.code } as typeof TRIP;
    },
    leaveTrip(state) {
      state.joined = false;
    },
  },
});

export const { createTrip, joinTrip, leaveTrip } = tripSlice.actions;
export default tripSlice.reducer;
