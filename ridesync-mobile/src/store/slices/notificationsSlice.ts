import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationItem } from '../../data/mockData';

export interface NotificationsState {
  /** Notifications on this device only, starting empty — no seeded notifications. */
  items: NotificationItem[];
}

const initialState: NotificationsState = { items: [] };

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
    addNotification(state, action: PayloadAction<NotificationItem>) {
      state.items = [action.payload, ...state.items];
    },
  },
});

export const { markAllRead, markRead, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
