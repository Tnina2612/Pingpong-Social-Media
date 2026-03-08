import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";
import { UploadModule } from "src/upload/upload.module";

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
