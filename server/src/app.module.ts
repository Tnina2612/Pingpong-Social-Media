import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { CommentsModule } from "./comments/comments.module";
import { LikesModule } from "./likes/likes.module";
import { PostsModule } from "./posts/posts.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { SampleModule } from "./sample/sample.module";
import { UploadModule } from "./upload/upload.module";
import { UsersModule } from "./users/users.module";
import { ServerModule } from "./server/server.module";
import { ChannelModule } from "./channel/channel.module";
import { MessageModule } from "./message/message.module";
import { MemberModule } from './member/member.module';

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
    CloudinaryModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    UploadModule,
    ServerModule,
    ChannelModule,
    MessageModule,
    MemberModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
