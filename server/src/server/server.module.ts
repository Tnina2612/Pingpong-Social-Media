import { Module } from "@nestjs/common";
import { ServerService } from "./server.service";
import { ServerController } from "./server.controller";
import { UploadService } from "src/upload/upload.service";

@Module({
  controllers: [ServerController],
  providers: [ServerService, UploadService],
})
export class ServerModule {}
