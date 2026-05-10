import { configureStore } from '@reduxjs/toolkit'
import threadSlice from './threadSlice';
import chatSlice from './chatSlice';

export const store = configureStore({
  reducer: {
    thread: threadSlice,
    chat: chatSlice
  }
})


export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store