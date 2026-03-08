import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { AttachmentStatus, AttachmentType } from "@prisma/client";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { DeleteAttachmentDto } from "./dto";
import { UploadResponseDto } from "./response";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UploadService {
  constructor(private readonly cloudinaryService: CloudinaryService, private readonly prisma : PrismaService) {}

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

      const attachment = await this.prisma.attachment.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        type: attachmentType,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: AttachmentStatus.TEMP,
      },
    });

    return {
      id: attachment.id,
      url: attachment.url,
      publicId: attachment.publicId,
      type: attachment.type,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      status : attachment.status
    };
    } catch (error) {
      throw new InternalServerErrorException("Failed to upload media");
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
