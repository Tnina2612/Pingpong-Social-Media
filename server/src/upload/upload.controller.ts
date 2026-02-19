import {
  Controller,
  FileTypeValidator,
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
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@ApiTags("File Uploading")
@ApiBearerAuth()
@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

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
    schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
          description: "Public URL of the uploaded file",
        },
        publicId: {
          type: "string",
          example: "sample_image_123",
          description: "Cloudinary public ID for managing the file",
        },
        type: {
          type: "string",
          example: "image",
          description: "Resource type (image or video)",
        },
      },
    },
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
          new FileTypeValidator({ fileType: ".(png|jpeg|jpg|mp4|mov)" }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadFile(file);

    return {
      url: result.secure_url,
      publicId: result.public_id, // Save this if you want to delete it later!
      type: result.resource_type, // 'image' or 'video'
    };
  }
}
