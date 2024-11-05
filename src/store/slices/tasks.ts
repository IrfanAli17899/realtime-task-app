import { getTasksAction, GetTasksInput, Tasks } from "@/actions"
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"


interface TaskState {
  data: Tasks
  loading: boolean
  error: string | null
}

const initialTaskState: TaskState = {
  data: [],
  loading: false,
  error: null,
}

export const getTasks = createAsyncThunk<Tasks, GetTasksInput>(
  'tasks/fetch-tasks',
  async (props) => {
    return await getTasksAction(props)
  }
)

const taskSlice = createSlice({
  name: 'tasks',
  initialState: initialTaskState,
  reducers: {
    initialTasks: (state, action: PayloadAction<Tasks>) => {
      state.data = action.payload
    },
    addTask: (state, action: PayloadAction<Tasks[0]>) => {
      state.data.push(action.payload)
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.data = state.data.filter((item) => item.id !== action.payload)
    },
    updateTask: (state, action: PayloadAction<Tasks[0]>) => {
      const taskIndex = state.data.findIndex((item) => item.id === action.payload.id)
      state.data[taskIndex] = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTasks.pending, (state) => {
        state.loading = true
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(getTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch tasks'
      })
  },
})

export const { addTask, removeTask, updateTask, initialTasks } = taskSlice.actions
export const taskReducer = taskSlice.reducer