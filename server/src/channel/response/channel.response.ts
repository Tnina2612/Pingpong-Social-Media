import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { ChannelType } from "@prisma/client";

export class ChannelResponseDto {
  @ApiProperty({
    description: "Unique identifier of the channel",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Name of the channel",
    example: "general",
    type: String,
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: "Type of the channel (TEXT or VOICE)",
    example: "TEXT",
    enum: ["TEXT", "VOICE"],
  })
  @Expose()
  type: ChannelType;

  @ApiProperty({
    description: "Number of messages in the channel",
    example: 42,
    type: Number,
  })
  @Expose()
  messageCount: number;
}
