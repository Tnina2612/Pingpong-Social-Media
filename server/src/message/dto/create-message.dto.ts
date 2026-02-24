import { IsString, IsOptional, IsUUID, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMessageDto {
  @IsString()
  @IsUUID()
  @ApiProperty({
    type: String,
    format: "uuid",
    description: "Channel ID where the message will be sent",
  })
  channelId: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  @ApiProperty({
    type: String,
    description: "Message content (optional if files are provided)",
    maxLength: 4000,
    required: false,
  })
  content?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  @ApiProperty({
    type: String,
    format: "uuid",
    description: "ID of the message this is a reply to (optional)",
    required: false,
  })
  replyToId?: string;
}
