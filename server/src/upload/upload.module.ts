import { Module } from "@nestjs/common";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { AttachmentCleanupService } from "./cleanup.service";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

@Module({
  imports: [CloudinaryModule],
  controllers: [UploadController],
  providers: [UploadService, AttachmentCleanupService],
  exports: [UploadService],
})
export class UploadModule {}
