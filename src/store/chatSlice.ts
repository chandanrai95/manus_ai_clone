import { ChatHistoryReturnType, ChatMessage, fetchChatHistory, IFetchChatHistoryType } from "@/lib/api/thread"
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";



export type TodoStatus = "in_progress" | "pending" | "completed"
export type TodoListType = Array<{ id: string, task: string, status: TodoStatus }>
export type AgentFileType = { filename: string, content: string }
type ChatState = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  todos: TodoListType,
  agent_files: AgentFileType[]
  agent_images: any[]

  // panel
  chatPanelPadding: 'chat' | 'computer',
  leftPanel: 'sidebar' | 'aiworkspace',
  reportModal: {
    display: boolean,
    content: string
  }
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
  todos: [],
  agent_files: [],
  agent_images: [],

  // right panel
  chatPanelPadding: 'chat',
  leftPanel: 'sidebar',
  reportModal: {
    display: false,
    content: ""
  }
}

export const getChatHistory = createAsyncThunk<
  ChatHistoryReturnType,
  IFetchChatHistoryType,
  { rejectValue: string }
>("chat/getHistory", async ({ userId, threadId }, { rejectWithValue }) => {
  try {
    const res = await fetchChatHistory({ userId, threadId })
    return res;
  } catch (error) {
    return rejectWithValue("Failed to load chat history")
  }
})

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearChat(state) {
      state.messages = [];
    },

    modifyReportModalContent(state, action: PayloadAction<string> ) {
      state.reportModal.content = action.payload
    },

    toggleViewReportModal(state) {
      state.reportModal.display = !state.reportModal.display
    },

    toggleLeftPanels(state) {
      state.leftPanel == "sidebar" ?
        state.leftPanel = 'aiworkspace' :
        state.leftPanel = 'sidebar'
    },

    toggleChatPanlePadding(state, action: PayloadAction<'computer' | 'chat'>) {
      state.chatPanelPadding == "chat" ?
        state.chatPanelPadding = 'computer' :
        state.chatPanelPadding = 'chat'
    },

    addUsersAndAiPlaceholder(state, action) {
      state.messages.push(
        {
          role: 'user',
          content: action.payload.content,
          userId: action.payload.userId,
          threadId: action.payload.threadId,
          thinking: "",
          sub_agent: []
        },
        {
          role: 'ai',
          content: "",
          thinking: "",
          userId: action.payload.userId,
          threadId: action.payload.threadId,
          sub_agent: []
        }
      );
    },

    addAgentFile(
      state,
      action: PayloadAction<AgentFileType>
    ) {
      console.log('addAgentFile --', action.payload)
      state.chatPanelPadding = "computer"
      state.agent_files.push(action.payload)
    },

    addAgentImage(
      state,
      action
    ) {
      state.chatPanelPadding = "computer"
      state.agent_images.push({
        id: uuidv4(),
        type: "image",
        src: action.payload.src,
        created_at: Date.now()
      })
    },

    appendToLastAiMessageSubAgent(
      state,
      action: PayloadAction<{
        sub_agent_name: string;
        content: string;
      }>
    ) {
      state.leftPanel = 'aiworkspace';
      const last = state.messages[state.messages.length - 1];
      // console.log('appendToLastAiMessageSubAgent---', action)
      if (!last || last.role !== "ai") return;

      const existing = last.sub_agent.find(
        (sa: any) => sa.sub_agent_name === action.payload.sub_agent_name
      );

      if (existing) {
        existing.content += action.payload.content
      } else {
        last.sub_agent.push({
          sub_agent_name: action.payload.sub_agent_name,
          content: action.payload.content
        })
      }
    },

    appendToLastAiMessage(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1]
      if (last?.role == 'ai') {
        last.content += action.payload
      }
    },

    appendToAssistantThinking(state, action: PayloadAction<string>) {
      const last = state.messages[state.messages.length - 1]
      if (last?.role == 'ai') {
        last.thinking = (last.thinking || "") + action.payload
      }
    },
    clearTodos(state) {
      state.todos = []
    },
    addTodos(state, action: PayloadAction<TodoListType>) {
      state.leftPanel = 'aiworkspace'
      state.todos.push(...action.payload)
    },
    updateTodos(
      state,
      action: PayloadAction<{
        updates: { id: string; status: TodoStatus }[];
      }>
    ) {
      action.payload.updates.forEach((update) => {
        const todo = state.todos.find((t: any) => t.id === update.id)
        if (todo) {
          todo.status = update.status
        }
      })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.messages;
      })
      .addCase(getChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      })
  }
})

export const { modifyReportModalContent, toggleViewReportModal, toggleChatPanlePadding, toggleLeftPanels, clearChat, appendToAssistantThinking, appendToLastAiMessage, addUsersAndAiPlaceholder, appendToLastAiMessageSubAgent, clearTodos, addTodos, updateTodos, addAgentFile, addAgentImage } = chatSlice.actions;

export default chatSlice.reducer;