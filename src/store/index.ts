import { configureStore } from "@reduxjs/toolkit"
import { taskReducer } from "./slices/tasks"
import { userReducer } from "./slices/users"

export const store = configureStore({
    reducer: {
        tasks: taskReducer,
        users: userReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    }),
    devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export * from './slices/tasks';
export * from './slices/users';