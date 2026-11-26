import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertItem, ChatMessage, Member } from '../../data/mockData';

export interface MembersState {
  /** Other riders in this convoy. Empty until someone joins on this device — no seeded members. */
  members: Member[];
  /** Chat on this device only, starting empty. */
  chat: ChatMessage[];
  /** Alerts on this device only, starting empty. */
  alerts: AlertItem[];
  /** Ride clock in seconds. Only advances while a real trip is live — it never invents a ride. */
  rideSeconds: number;
  sosActive: boolean;
  voiceActive: boolean;
}

const initialState: MembersState = {
  members: [],
  chat: [],
  alerts: [],
  rideSeconds: 0,
  sosActive: false,
  voiceActive: false,
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    /** One second of a real ride. No member movement, no fake speed — members only move with real GPS. */
    tick(state) {
      state.rideSeconds += 1;
    },
    resetRide(state) {
      state.rideSeconds = 0;
    },
    sendChat(state, action: PayloadAction<{ text: string; author: string; initials: string; isLeader: boolean }>) {
      state.chat = [
        ...state.chat,
        {
          id: `m-${Date.now()}`,
          author: action.payload.author,
          initials: action.payload.initials,
          isLeader: action.payload.isLeader,
          text: action.payload.text,
          time: new Date().toTimeString().slice(0, 5),
        },
      ];
    },
    addAlert(state, action: PayloadAction<{ title: string; detail: string; kind: AlertItem['kind'] }>) {
      state.alerts = [
        {
          id: `a-${Date.now()}`,
          title: action.payload.title,
          detail: action.payload.detail,
          kind: action.payload.kind,
          time: 'just now',
        },
        ...state.alerts,
      ];
    },
    setSos(state, action: PayloadAction<boolean>) {
      state.sosActive = action.payload;
    },
    setVoice(state, action: PayloadAction<boolean>) {
      state.voiceActive = action.payload;
    },
  },
});

export const { tick, resetRide, sendChat, addAlert, setSos, setVoice } = membersSlice.actions;
export default membersSlice.reducer;
