// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private config: ConfigService) {
    super({
      accelerateUrl: config.get<string>("DATABASE_URL"),
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
}
