import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { RedisModule } from "src/redis/redis.module";
import { FeedService } from "./feed.service";
import { FeedConfigService } from "./feed-config.service";

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [FeedService, FeedConfigService],
  exports: [FeedService, FeedConfigService],
})
export class FeedModule {}
