import {
  Body,
  Controller,
  Delete,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DeleteAttachmentDto } from "./dto";
import { UploadResponseDto } from "./response/upload.response";
import { UploadService } from "./upload.service";

@ApiTags("Media Uploading")
@ApiBearerAuth()
@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // POST /api/upload
  @ApiOperation({
    summary: "Upload media file",
    description:
      "Uploads an image or video file to Cloudinary. Supports PNG, JPEG, JPG, MP4, and MOV formats. Maximum file size is 10MB.",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "File to upload",
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Image or video file (PNG, JPEG, JPG, MP4, MOV)",
        },
      },
      required: ["file"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "File uploaded successfully",
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid file - exceeds size limit or unsupported file type",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Post()
  @UseInterceptors(FileInterceptor("file")) // 'file' is the field name in form-data
  async uploadAttachment(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Limit size to 10MB (adjust as needed)
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadAttachment(file);
  }

  // DELETE /api/upload
  @ApiOperation({
    summary: "Delete media file",
    description:
      "Deletes a previously uploaded file from Cloudinary using its public ID",
  })
  @ApiBody({
    description: "Public ID of the file to delete",
    schema: {
      type: "object",
      properties: {
        publicId: {
          type: "string",
          example: "sample_image_123",
          description: "Cloudinary public ID of the file to delete",
        },
      },
      required: ["publicId"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "File deleted successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid publicId",
  })
  @ApiResponse({
    status: 404,
    description: "File not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Delete()
  async deleteAttachment(@Body() dto: DeleteAttachmentDto) {
    return this.uploadService.deleteAttachment(dto);
  }
}
