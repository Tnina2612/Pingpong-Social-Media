import { ChannelType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: "Name of the channel",
    example: "general",
  })
  name: string;

  @IsEnum(ChannelType)
  @ApiProperty({
    enum: ChannelType,
    description: "Type of the channel (TEXT or VOICE)",
    example: "TEXT",
  })
  type: ChannelType;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: "Server ID that the channel belongs to",
    format: "uuid",
  })
  serverId: string;
}
