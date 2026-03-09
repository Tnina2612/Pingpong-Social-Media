import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMessageDto {
  @ApiProperty({
    type: String,
    description: "Message content (optional if files are provided)",
    maxLength: 4000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content: string;
}
