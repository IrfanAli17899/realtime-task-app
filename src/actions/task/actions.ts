"use server"
import db from "@/models"
import { CreateTaskInput, DeleteTaskInput, GetTaskDetailInput, GetTasksInput, UpdateTaskInput } from "./dto"
import { getAuthUser } from "../user"

export const getTasksAction = async (props: GetTasksInput) => {
    const user = await getAuthUser()
    const { search, status, createdBy } = props;
    return await db.task.findMany({
        where: {
            title: { contains: search, mode: "insensitive" },
            status,
            userId: createdBy,
            OR: [{ userId: user.id }, { assignments: { some: { userId: user.id } } }]
        },
        include: {
            user: { select: { id: true, name: true, image: true } },
            assignments: { include: { user: { select: { id: true, name: true, image: true } } } }
        }
    })
}

export const getTaskDetailAction = async (props: GetTaskDetailInput) => {
    const { id } = props
    const user = await getAuthUser()
    return await db.task.findUnique({
        where: {
            id,
            userId: user.id
        }
    })
}

export const createTaskAction = async (props: CreateTaskInput) => {
    const user = await getAuthUser()
    return await db.task.create({
        data: {
            ...props, userId: user.id, assignments: {
                createMany: {
                    data: props.assignments.map(id => ({ userId: id }))
                }
            }
        },
        include: {
            user: { select: { id: true, name: true, image: true } },
            assignments: { include: { user: { select: { id: true, name: true, image: true } } } }
        }
    })
}

export const updateTaskAction = async (props: UpdateTaskInput) => {
    const { id, ...data } = props
    return await db.task.update({
        where: { id },
        data,
        include: {
            user: { select: { id: true, name: true, image: true } },
            assignments: { include: { user: { select: { id: true, name: true, image: true } } } }
        }
    })
}

export const deleteTaskAction = async (props: DeleteTaskInput) => {
    const { id } = props
    return await db.task.delete({
        where: { id }
    })
}