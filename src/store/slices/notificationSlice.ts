/**
 * ChurchOS — src/store/slices/notificationSlice.ts
 * Keeps the unread badge count in global Redux state so
 * TopBar and Sidebar can both read it without prop drilling.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  unreadCount: number;
}

const initialState: NotificationState = {
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    decrementUnread(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnread(state) {
      state.unreadCount = 0;
    },
  },
});

export const { setUnreadCount, decrementUnread, clearUnread } =
  notificationSlice.actions;

export default notificationSlice.reducer;