import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CustomizationState {
  opened: boolean;
}

const initialState: CustomizationState = {
  opened: true,
};

export const customzationSlice = createSlice({
  name: 'customization',
  initialState,
  reducers: {
    toggleDrawer(state) {
      state.opened = !state.opened;
    },
  },
});

export const { toggleDrawer } = customzationSlice.actions;
export default customzationSlice.reducer;
