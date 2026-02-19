import { Injectable } from "@nestjs/common";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { UploadResponseDto } from "./response/upload.response";

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadMedia(file: Express.Multer.File): Promise<UploadResponseDto> {
    try {
      const result = await this.cloudinaryService.uploadFile(file);

      return {
        url: result.secure_url,
        publicId: result.public_id, // Save this if you want to delete it later!
        type: result.resource_type, // 'image' or 'video'
      };
    } catch (error) {
      throw new Error("Failed to upload media");
    }
  }

  async deleteMedia(publicId: string) {
    try {
      const result = await this.cloudinaryService.deleteFile(publicId);

      return {
        message: "Media deleted successfully",
        result,
      };
    } catch (error) {
      throw new Error("Failed to delete media");
    }
  }
}
