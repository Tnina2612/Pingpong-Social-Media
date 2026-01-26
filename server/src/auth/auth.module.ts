import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => ({
        secret:
          configService.get<string>("JWT_SECRET") ||
          "your-secret-key-change-in-production",
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRES_IN") || "7d",
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
