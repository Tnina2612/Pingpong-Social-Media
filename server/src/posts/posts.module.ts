import { Module } from "@nestjs/common";
import { FeedModule } from "src/feed/feed.module";
import { PrismaModule } from "src/prisma/prisma.module";
import { UploadModule } from "src/upload/upload.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  imports: [PrismaModule, UploadModule, FeedModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
