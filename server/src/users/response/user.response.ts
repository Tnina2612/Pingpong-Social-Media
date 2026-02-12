import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserResponseDto {
  @ApiProperty({
    description: "Unique identifier of the user",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Username of the user",
    example: "john_doe",
    type: String,
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: "Email address of the user",
    example: "john.doe@example.com",
    type: String,
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: "Avatar URL of the user",
    example: "https://example.com/avatar.jpg",
    type: String,
    nullable: true,
  })
  @Expose()
  avatar: string | null;

  @ApiProperty({
    description: "Bio/description of the user",
    example: "Software developer and tech enthusiast",
    type: String,
    nullable: true,
  })
  @Expose()
  bio: string | null;

  @ApiProperty({
    description: "Date and time when the user was created",
    example: "2026-01-15T10:30:00Z",
    type: Date,
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Date and time when the user was last seen",
    example: "2026-02-11T14:20:00Z",
    type: Date,
  })
  @Expose()
  lastSeen: Date;

  @ApiProperty({
    description: "Whether the user's account is activated",
    example: true,
    type: Boolean,
  })
  @Expose()
  isActivated: boolean;
}
