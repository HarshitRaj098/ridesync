import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ALERTS, CHAT_MESSAGES, MEMBERS, Member } from '../../data/mockData';

export interface MembersState {
  members: Member[];
  chat: typeof CHAT_MESSAGES;
  alerts: typeof ALERTS;
  speedKmh: number;
  rideSeconds: number;
  sosActive: boolean;
  voiceActive: boolean;
}

const initialState: MembersState = {
  members: MEMBERS,
  chat: CHAT_MESSAGES,
  alerts: ALERTS,
  speedKmh: 62,
  rideSeconds: 6128, // 01:42:08, matching the HTML prototype
  sosActive: false,
  voiceActive: false,
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    /** Simulated live tick (socketService drives this every ~2.5s). */
    tick(state) {
      state.rideSeconds += 1;
      state.speedKmh = 45 + Math.round(Math.random() * 30);
      state.members = state.members.map((m) => {
        if (m.status !== 'online' || m.speedKmh === null) return m;
        const nextSpeed = Math.max(40, Math.min(85, m.speedKmh + Math.round(Math.random() * 7 - 3)));
        return {
          ...m,
          speedKmh: nextSpeed,
          lat: m.lat + (Math.random() - 0.5) * 0.0006,
          lng: m.lng + (Math.random() - 0.5) * 0.0006,
        };
      });
    },
    sendChat(state, action: PayloadAction<{ text: string }>) {
      state.chat = [
        ...state.chat,
        {
          id: `m-${Date.now()}`,
          author: 'You',
          initials: 'SK',
          isLeader: false,
          text: action.payload.text,
          time: new Date().toTimeString().slice(0, 5),
        },
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

export const { tick, sendChat, setSos, setVoice } = membersSlice.actions;
export default membersSlice.reducer;
