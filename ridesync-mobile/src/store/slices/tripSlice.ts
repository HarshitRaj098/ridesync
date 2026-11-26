import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { buildInviteLink, Trip } from '../../data/mockData';

export interface TripState {
  /** The one trip on this device, or null when no trip exists yet. Session-only (no persistence). */
  currentTrip: Trip | null;
  joined: boolean;
  /** Inline join error shown on Join Trip; null when there is none. */
  joinError: string | null;
  /** Real local totals: only rides actually ended on this device. */
  lifetime: { rides: number; km: number };
}

const initialState: TripState = {
  currentTrip: null,
  joined: false,
  joinError: null,
  lifetime: { rides: 0, km: 0 },
};

export interface CreateTripPayload {
  name: string;
  origin: string;
  destination: string;
  date: string;
  startTime: string;
  type: 'Public' | 'Private';
  riderLimit: number;
  code: string;
  leaderName: string;
}

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    /**
     * Create a real local trip from the form the user filled in.
     * The code is generated once when the Create Trip form opens and
     * passed in here — never a seeded code. TODO: POST /api/trips.
     */
    createTrip(state, action: PayloadAction<CreateTripPayload>) {
      const p = action.payload;
      state.currentTrip = {
        id: `trip-${Date.now()}`,
        name: p.name.trim(),
        origin: p.origin.trim(),
        destination: p.destination.trim(),
        distanceKm: null, // not estimated yet — no fake distance
        riderLimit: p.riderLimit,
        type: p.type,
        date: p.date.trim(),
        startTime: p.startTime.trim(),
        code: p.code.toUpperCase(),
        inviteLink: buildInviteLink(p.code),
        leaderName: p.leaderName.trim(),
      };
      state.joined = true;
      state.joinError = null;
    },
    /**
     * Join by code. Trips live only on the device where they were
     * created, so a code only works when it matches this device's trip.
     * Anything else is an inline error, never a silent join.
     * TODO: POST /api/trips/join { code } via api/tripService.
     */
    joinTrip(state, action: PayloadAction<{ code: string }>) {
      const code = action.payload.code.trim().toUpperCase();
      if (state.currentTrip && state.currentTrip.code === code) {
        state.joined = true;
        state.joinError = null;
      } else {
        state.joined = false;
        state.joinError =
          `No trip with code ${code} on this device. Trips live only on the device where they were created — ` +
          'ask the leader for a fresh invite, or create a trip.';
      }
    },
    clearJoinError(state) {
      state.joinError = null;
    },
    leaveTrip(state) {
      state.joined = false;
      state.currentTrip = null;
    },
    /**
     * End the real trip: record one completed ride on this device and
     * clear the trip. Distance stays 0 unless it was ever estimated.
     */
    endTrip(state) {
      if (!state.currentTrip) return;
      state.lifetime.rides += 1;
      state.lifetime.km += state.currentTrip.distanceKm ?? 0;
      state.currentTrip = null;
      state.joined = false;
    },
  },
});

export const { createTrip, joinTrip, clearJoinError, leaveTrip, endTrip } = tripSlice.actions;
export default tripSlice.reducer;
