import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeleteMediaDto {
  @ApiProperty({
    description: "Cloudinary public ID of the file to delete",
    example: "sample_image_123",
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: "publicId cannot be empty" })
  publicId: string;
}
