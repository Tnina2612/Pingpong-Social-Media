import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import Redis from "ioredis";
import { serializeRqData } from "utils";

@Injectable()
export class TasksService {
  constructor(@Inject("REDIS") private redis: Redis) {}

  // Runs every Sunday at 2:00 AM
  @Cron(CronExpression.EVERY_WEEKEND)
  async triggerCommunityClustering() {
    console.log(
      "Dispatching weekly community detection job to Python worker...",
    );

    const jobId = `cluster-job-${Date.now()}`;
    const jobData = {
      created_at: new Date().toISOString(),
      id: jobId,
      origin: "post_processing",
      description: "Weekly community detection job",
      enqueued_at: new Date().toISOString(),
      started_at: "",
      ended_at: "",
      result_ttl: 500,
      failure_ttl: 31536000,
      status: "queued",
      data: serializeRqData("cluster_users.run_community_detection", []),
    };

    await this.redis.hset(`rq:job:${jobId}`, jobData);
    await this.redis.rpush("rq:queue:post_processing", jobId);
  }

  // Pushes an interaction event to the Python ML worker to dynamically
  // update the user's Interest Vector
  async enqueueVectorUpdate(userId: string, postId: string, weight: number) {
    // Generate a unique Job ID
    const jobId = `vector-update-${userId}-${postId}-${Date.now()}`;
    const queueName = "rq:queue:post_processing";

    // Format the payload exactly as Python's 'rq' library expects
    const jobData = {
      created_at: new Date().toISOString(),
      id: jobId,
      origin: "post_processing",
      description: `update_user_vector('${userId}', '${postId}', ${weight})`,
      enqueued_at: new Date().toISOString(),
      status: "queued",
      // Point directly to the function we wrote in worker.py
      data: serializeRqData("worker.update_user_vector", [
        userId,
        postId,
        weight,
      ]),
    };

    // Execute atomically via Redis Pipeline
    const pipeline = this.redis.pipeline();
    pipeline.hset(`rq:job:${jobId}`, jobData);
    pipeline.rpush(queueName, jobId);

    try {
      await pipeline.exec();
      console.log(
        `Queued vector update for User ${userId} (Weight: ${weight})`,
      );
    } catch (error) {
      console.error(`Failed to queue vector update for User ${userId}:`, error);
    }
  }
}
