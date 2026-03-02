import { BadRequestException, Injectable } from "@nestjs/common";
import { AttachmentType } from "@prisma/client";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { DeleteAttachmentDto } from "./dto";
import { UploadResponseDto } from "./response";

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadAttachment(
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    try {
      if (!file) throw new BadRequestException("No file provided");
      const result = await this.cloudinaryService.uploadFile(file);

      let attachmentType: AttachmentType = AttachmentType.FILE;
      if (file.mimetype.startsWith("image/"))
        attachmentType = AttachmentType.IMAGE;
      else if (file.mimetype.startsWith("video/"))
        attachmentType = AttachmentType.VIDEO;
      else if (file.mimetype.startsWith("audio/"))
        attachmentType = AttachmentType.AUDIO;

      return {
        url: result.secure_url,
        publicId: result.public_id, // Save this if you want to delete it later!
        type: attachmentType,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      throw new Error("Failed to upload media");
    }
  }

  async deleteAttachment(dto: DeleteAttachmentDto) {
    // Map Prisma Enum to Cloudinary resource_type
    let resourceType: "image" | "video" | "raw" = "image";

    if (dto.attachmentType === AttachmentType.FILE) {
      resourceType = "raw";
    } else if (
      dto.attachmentType === AttachmentType.VIDEO ||
      dto.attachmentType === AttachmentType.AUDIO
    ) {
      resourceType = "video"; // Cloudinary groups audio under video
    }

    try {
      const result = await this.cloudinaryService.deleteFile(
        dto.publicId,
        resourceType,
      );

      return {
        message: "Media deleted successfully",
        result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete media: ${error.message}`);
    }
  }
}
