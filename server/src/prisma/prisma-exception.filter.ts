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
      throw new ConflictException("Data existed before");
    }
    throw exception;
  }
}
