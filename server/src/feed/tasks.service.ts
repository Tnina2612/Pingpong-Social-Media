import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import Redis from "ioredis";

@Injectable()
export class TasksService {
  constructor(@Inject("REDIS") private redis: Redis) {}

  // Runs every Sunday at 2:00 AM
  @Cron(CronExpression.EVERY_WEEKEND)
  async triggerCommunityClustering() {
    console.log(
      "Dispatching weekly community detection job to Python worker...",
    );

    const event = {
      type: "TRIGGER_COMMUNITY_CLUSTERING",
      data: JSON.stringify({}),
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

    console.log("[Redis Stream] TRIGGER_COMMUNITY_CLUSTERING event queued");
  }

  // Pushes an interaction event to the Python ML worker to dynamically
  // update the user's Interest Vector
  async enqueueVectorUpdate(userId: string, postId: string, weight: number) {
    const event = {
      type: "UPDATE_USER_VECTOR",
      data: JSON.stringify({
        userId,
        postId,
        weight,
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

    try {
      console.log(
        `[Redis Stream] UPDATE_USER_VECTOR event queued for User ${userId} (Weight: ${weight})`,
      );
    } catch (error) {
      console.error(`Failed to queue vector update for User ${userId}:`, error);
    }
  }
}
