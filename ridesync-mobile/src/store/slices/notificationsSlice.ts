import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NOTIFICATIONS } from '../../data/mockData';

export interface NotificationsState {
  items: typeof NOTIFICATIONS;
}

const initialState: NotificationsState = { items: NOTIFICATIONS };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, unread: false }));
    },
    markRead(state, action: PayloadAction<string>) {
      state.items = state.items.map((n) => (n.id === action.payload ? { ...n, unread: false } : n));
    },
    addNotification(state, action: PayloadAction<(typeof NOTIFICATIONS)[number]>) {
      state.items = [action.payload, ...state.items];
    },
  },
});

export const { markAllRead, markRead, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
