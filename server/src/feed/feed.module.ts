import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { RedisModule } from "src/redis/redis.module";
import { FeedService } from "./feed.service";
import { FeedConfigService } from "./feed-config.service";
import { InteractionsController } from "./interactions.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [InteractionsController],
  providers: [FeedService, FeedConfigService, TasksService],
  exports: [FeedService, FeedConfigService],
})
export class FeedModule {}
