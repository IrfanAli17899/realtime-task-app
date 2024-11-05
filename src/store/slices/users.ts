import { getUsers } from "@/actions"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

type IUsers = Awaited<ReturnType<typeof getUsers>>

interface UserState {
  data: IUsers
  loading: boolean
  error: string | null
}

const initialUserState: UserState = {
  data: [],
  loading: false,
  error: null,
}

export const fetchUsers = createAsyncThunk(
  'users/fetch-users',
  async () => {
    return await getUsers()
  }
)

const userSlice = createSlice({
  name: 'users',
  initialState: initialUserState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch users'
      })
  },
})

export const userReducer = userSlice.reducer