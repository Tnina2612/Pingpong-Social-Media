import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SampleModule } from "./sample/sample.module";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from './redis/redis.module';
import { MailService } from './mail/mail.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", ".env.local"],
      isGlobal: true,
    }),
    SampleModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
