import { PrismaClient } from "@prisma/client";

export const isProduction = process.env.NODE_ENV === "production";

const prismaClientSingleton = () => {
	return new PrismaClient();
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (!isProduction) globalThis.prismaGlobal = prisma;