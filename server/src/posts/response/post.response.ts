import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { AuthorDto } from "src/users/dto";
import { AttachmentPayload } from "../dto";

export class PostStatsDto {
  @ApiProperty({
    description: "Number of likes on the post",
    example: 42,
    type: Number,
  })
  @Expose()
  likeCount: number;

  @ApiProperty({
    description: "Number of comments on the post",
    example: 15,
    type: Number,
  })
  @Expose()
  commentCount: number;
}

export class PostResponseDto {
  @ApiProperty({
    description: "Unique identifier of the post",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Content of the post",
    example: "Just shared an amazing photo from my vacation!",
    type: String,
  })
  @Expose()
  content: string;

  @ApiProperty({
    description: "Array of media attachments for the post",
  })
  @Expose()
  attachments: AttachmentPayload[];

  @ApiProperty({
    description: "Date and time when the post was created",
    example: "2026-02-03T10:30:00Z",
    type: Date,
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Author of the post",
    type: () => AuthorDto,
  })
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @ApiProperty({
    description: "Whether the requesting user has liked this post",
    example: true,
    type: Boolean,
  })
  @Expose()
  isLiked: boolean;

  @ApiProperty({
    description: "Post statistics including likes and comments count",
    type: () => PostStatsDto,
  })
  @Expose()
  @Type(() => PostStatsDto)
  stats: PostStatsDto;
}
