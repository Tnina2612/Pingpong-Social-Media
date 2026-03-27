import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { serializeRqData } from "utils";

@Injectable()
export class UsersService {
  constructor(@Inject("REDIS") private redis: Redis) {}

  async triggerVectorInitialization(userId: string, topics: string[]) {
    if (topics.length < 3) {
      throw new BadRequestException("At least 3 topics must be chosen");
    }
    
    const jobId = `init-vector-${userId}`;

    const jobData = {
      created_at: new Date().toISOString(),
      id: jobId,
      origin: "post_processing", // Using the same worker queue
      description: `initialize_user_vector('${userId}', ...)`,
      status: "queued",
      // Point to the new function in worker.py
      data: serializeRqData("worker.initialize_user_vector", [userId, topics]),
    };

    const pipeline = this.redis.pipeline();
    pipeline.hset(`rq:job:${jobId}`, jobData);
    pipeline.rpush("rq:queue:post_processing", jobId);
    await pipeline.exec();
  }
}
