import { Module } from "@nestjs/common";
import { UploadService } from "src/upload/upload.service";
import { ServerController } from "./server.controller";
import { ServerService } from "./server.service";

@Module({
  controllers: [ServerController],
  providers: [ServerService, UploadService],
})
export class ServerModule {}
