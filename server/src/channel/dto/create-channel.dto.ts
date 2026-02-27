import { ApiProperty } from "@nestjs/swagger";
import { ChannelType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateChannelDto {
  @ApiProperty({
    type: String,
    format: "uuid",
    description: "Server ID that the channel belongs to",
    example: "550e8400-e29b-41d4-a716-446655440000",
    required: true,
  })
  @IsUUID()
  @IsNotEmpty({ message: "Server ID cannot be empty" })
  serverId: string;

  @ApiProperty({
    type: String,
    description: "Name of the channel",
    example: "general",
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: "Channel name cannot be empty" })
  name: string;

  @ApiProperty({
    enum: ChannelType,
    description: "Type of the channel (TEXT or VOICE)",
    example: "TEXT",
    required: true,
  })
  @IsEnum(ChannelType)
  @IsNotEmpty({ message: "Channel type cannot be empty" })
  type: ChannelType;
}
