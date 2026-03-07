import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: any;
}

const initialState: UiState = {
  sidebarOpen: true,
  activeModal: null,
  modalData: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    openModal: (state, action: PayloadAction<{ modal: string; data?: any }>) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => { state.activeModal = null; state.modalData = null; },
  },
});

export const { toggleSidebar, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
