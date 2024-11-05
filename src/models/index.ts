import { isProduction } from "@/config";
import { PrismaClient } from "@prisma/client";


const prismaClientSingleton = () => {
	return new PrismaClient();
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (!isProduction) globalThis.prismaGlobal = db;