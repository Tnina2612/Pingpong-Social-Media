import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MessageService } from "./message.service";
import { MessageController } from "./message.controller";
import { MessageGateway } from "./message.gateway";
import { UploadService } from "src/upload/upload.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>("JWT_ACCESS_SECRET") ||
          "your-secret-key-change-in-production",
        signOptions: {
          expiresIn: configService.get("JWT_ACCESS_EXPIRES_IN") || "7d",
        },
      }),
    }),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway, UploadService],
})
export class MessageModule {}
