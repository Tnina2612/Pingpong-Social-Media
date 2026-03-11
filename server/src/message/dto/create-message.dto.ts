import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateMessageDto {
  @ApiProperty({
    type: String,
    format: "uuid",
    description: "ID of the channel where the message will be sent",
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty({ message: "ID of the channel must be provided" })
  channelId: string;

  @ApiProperty({
    type: String,
    description: "Message content (optional if files are provided)",
    maxLength: 4000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @ApiProperty({
    type: String,
    format: "uuid",
    description: "ID of the message this is a reply to (optional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  replyToId?: string;

  @ApiProperty({
    description: "Array of attachment ids for the message",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  attachmentIds?: string[];
}
