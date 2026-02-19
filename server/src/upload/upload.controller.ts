import {
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  Param,
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
  async uploadMedia(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // 1. Limit size to 10MB (adjust as needed)
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          // 2. Allow only images and videos
          new FileTypeValidator({
            fileType:
              "image/png|image/jpeg|image/jpg|video/mp4|video/quicktime",
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadMedia(file);
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
  @Delete("/:publicId")
  async deleteMedia(@Param("publicId") publicId: string) {
    return this.uploadService.deleteMedia(publicId);
  }
}
