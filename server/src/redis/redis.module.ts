import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Global()
@Module({
  providers: [
    {
      provide: "REDIS",
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = new Redis({
          host: config.get<string>("REDIS_HOST") || "localhost",
          port: config.get<number>("REDIS_PORT") || 6379,
          lazyConnect: true,
        });

        redis.on("error", (err) => {
          console.error("Redis connection error:", err.message);
        });

        return redis;
      },
    },
  ],
  exports: ["REDIS"],
})
export class RedisModule {}
