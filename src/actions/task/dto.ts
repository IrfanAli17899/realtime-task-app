import { Prisma, TaskStatus } from '@prisma/client'
import { getTasksAction } from './actions'

export type GetTasksInput = {
    search?: string;
    status?: TaskStatus;
    createdBy?: string;
}

export type CreateTaskInput = Omit<Prisma.TaskCreateInput, "user"> & { assignments: string[] }

export type GetTaskDetailInput = { id: string }

export type UpdateTaskInput = Prisma.TaskUpdateInput & { id: string }

export type DeleteTaskInput = { id: string }

export type Tasks = Awaited<ReturnType<typeof getTasksAction>>
