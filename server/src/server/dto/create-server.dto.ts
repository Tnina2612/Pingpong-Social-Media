import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

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
    description: "Icon URL of the server",
    example: "https://example.com/image.jpg",
    type: String,
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  iconUrl?: string;
}
