"use server";
import { session } from "@/libs/auth"
import db from "@/models"

export const getAuthUser = async () => {
    const _session = await session()
    if (!_session?.user?.id) {
        throw new Error("User not found!")
    };
    return _session.user
}

export const getUser = async () => {
    const _session = await session();
    const id = _session?.user?.id
    if (!id) return null;
    return await db.user.findUnique({ where: { id } })
}

export const getUsers = async () => {
    const user = await getAuthUser()
    return await db.user.findMany({
        where: {
            NOT: { id: user.id }
        }
    })
}
