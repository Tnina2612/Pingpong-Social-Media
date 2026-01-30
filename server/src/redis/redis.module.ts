import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Global()
@Module({
  providers: [
    {
      provide: "REDIS",
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>("REDIS_HOST") || "localhost",
          port: config.get<number>("REDIS_PORT") || 6379,
        });
      },
    },
  ],
  exports: ["REDIS"],
})
export class RedisModule {}
