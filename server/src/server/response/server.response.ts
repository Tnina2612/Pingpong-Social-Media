import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { AuthorDto } from "src/users/dto";

export class ServerStatsDto {
  @ApiProperty({
    description: "Number of channels in the server",
    example: 5,
    type: Number,
  })
  @Expose()
  channelCount: number;

  @ApiProperty({
    description: "Number of members in the server",
    example: 42,
    type: Number,
  })
  @Expose()
  memberCount: number;
}

export class ServerResponseDto {
  @ApiProperty({
    description: "Unique identifier of the server",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Name of the server",
    example: "Gaming Community",
    type: String,
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: "Icon URL of the server",
    example: "https://example.com/server-icon.jpg",
    type: String,
    nullable: true,
  })
  @Expose()
  iconUrl: string | null;

  @ApiProperty({
    description: "Owner of the server",
    type: () => AuthorDto,
  })
  @Expose()
  @Type(() => AuthorDto)
  owner: AuthorDto;

  @ApiProperty({
    description: "Server statistics including channels and members count",
    type: () => ServerStatsDto,
  })
  @Expose()
  @Type(() => ServerStatsDto)
  stats: ServerStatsDto;
}
