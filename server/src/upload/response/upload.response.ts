import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UploadResponseDto {
  @ApiProperty({
    description: "Public URL of the uploaded file",
    example: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    type: String,
  })
  @Expose()
  url: string;

  @ApiProperty({
    description: "Cloudinary public ID for managing the file",
    example: "sample_image_123",
    type: String,
  })
  @Expose()
  publicId: string;

  @ApiProperty({
    description: "Resource type of the uploaded file",
    example: "image",
    enum: ["image", "video"],
  })
  @Expose()
  type: "image" | "video";
}
