import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class UsersService {
  constructor(@Inject("REDIS") private redis: Redis) {}

  async triggerVectorInitialization(userId: string, topics: string[]) {
    if (topics.length < 3) {
      throw new BadRequestException("At least 3 topics must be chosen");
    }

    const event = {
      type: "INIT_USER_VECTOR",
      data: JSON.stringify({
        userId,
        topics,
      }),
    };

    // Push event to Redis Stream
    await this.redis.xadd(
      "ml-stream", // stream name
      "*", // auto ID
      "type",
      event.type,
      "data",
      event.data,
    );

    console.log(`[Redis] INIT_USER_VECTOR event queued for user ${userId}`);
  }
}
