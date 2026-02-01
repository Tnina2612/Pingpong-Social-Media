import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === "P2002") {
      const target = (exception.meta as { target?: string[] } | undefined)
        ?.target;
      const fields =
        Array.isArray(target) && target.length > 0
          ? target.join(", ")
          : "the specified unique field";
      throw new ConflictException(
        `A record with the same value for ${fields} already exists.`,
      );
    }
    throw exception;
  }
}
