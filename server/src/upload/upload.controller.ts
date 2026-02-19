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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

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
