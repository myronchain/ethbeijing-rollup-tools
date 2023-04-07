import {configureStore} from '@reduxjs/toolkit';
import counterReducer from '@core/features/counter/counterSlice';
import customizationReducer from '@core/features/customization/customizationSlice';
import type {TypedUseSelectorHook} from 'react-redux';
import {useDispatch, useSelector} from 'react-redux';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    customization: customizationReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware();
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// Create typed versions of the useDispatch and useSelector hooks for usage in your application
// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
