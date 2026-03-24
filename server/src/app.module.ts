import { Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AdminModule } from "./admin/admin.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ChannelModule } from "./channel/channel.module";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { CommentsModule } from "./comments/comments.module";
import { LikesModule } from "./likes/likes.module";
import { MemberModule } from "./member/member.module";
import { MessageModule } from "./message/message.module";
import { PostsModule } from "./posts/posts.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { SampleModule } from "./sample/sample.module";
import { ServerModule } from "./server/server.module";
import { UploadModule } from "./upload/upload.module";
import { UsersModule } from "./users/users.module";
import { MediasoupModule } from "./mediasoup/mediasoup.module";
import { SignalingGateway } from "./signaling/signaling.gateway";
import { MediasoupService } from "./mediasoup/mediasoup.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", ".env.local"],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    SampleModule,
    AdminModule,
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
    MediasoupModule,
  ],
  controllers: [AppController],
  providers: [AppService, SignalingGateway],
})
export class AppModule implements OnModuleInit {
  constructor(private media: MediasoupService) {}
  async onModuleInit() {
    await this.media.init();
  }
}
