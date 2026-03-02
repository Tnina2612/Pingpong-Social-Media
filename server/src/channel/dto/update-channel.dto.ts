import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { CreateChannelDto } from "./create-channel.dto";

export class UpdateChannelDto extends PartialType(CreateChannelDto) {
  @ApiProperty({
    type: String,
    format: "uuid",
    description: "Server ID that the channel belongs to",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  @IsNotEmpty()
  serverId: string;
}
