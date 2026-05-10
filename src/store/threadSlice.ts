import { getThreads } from "@/lib/api/thread";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";


export interface Thread {
  threadId: string;
  userId: string;
  active: boolean;
  title: string;
  createdAt: String;
}

interface ThreadState {
  threads: Thread[];
  loading: boolean;
  error: string | null,
  currentThreadId: string | null
}

const initialState: ThreadState = {
  threads: [],
  loading: false,
  error: null,
  currentThreadId: null
}


export const fetchThreads = createAsyncThunk(
  "threads/fetchThreads",
  async (userId: string) => {
    const data = await getThreads(userId);
    return data;
  }
);


const threadSlice = createSlice({
  name: "threads",
  initialState,
  reducers: {
    setCurrentThread: (state, action: PayloadAction<string>) => {
      state.currentThreadId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchThreads.pending, (state, action) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchThreads.fulfilled, (state, action: PayloadAction<Thread[]>) => {
      state.loading = false;
      state.threads = action.payload;
    })
    .addCase(fetchThreads.rejected, (state, action) => {
      state.loading = false,
      state.error = action.error.message || "Failed to fetch threads"
    })
  }
})

export const { setCurrentThread } = threadSlice.actions
export default threadSlice.reducer;