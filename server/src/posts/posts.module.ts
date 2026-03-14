import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { UploadModule } from "src/upload/upload.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
