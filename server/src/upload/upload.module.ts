import { Module } from "@nestjs/common";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

@Module({
  imports: [CloudinaryModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
