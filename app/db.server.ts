import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// Создаем Prisma клиент с правильной конфигурацией
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

// В development используем глобальную переменную для hot reload
// В production создаем новый экземпляр
const prisma =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (global.prismaGlobal ??= createPrismaClient());

export default prisma;
