import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateServerDto {
  @ApiProperty({
    type: String,
    description: "Name of the server",
    example: "My Gaming Server",
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: "Server name cannot be empty" })
  name: string;

  @ApiProperty({
    description: "Attachment ID of the server icon",
    example: "att_123e4567-e89b-12d3-a456-426614174000",
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  iconAttachmentId?: string;
}
