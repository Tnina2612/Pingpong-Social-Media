import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { AuthorDto } from "src/users/dto";

export class CommentStatsDto {
  @ApiProperty({
    description: "Number of likes on the comment",
    example: 24,
    type: Number,
  })
  @Expose()
  likeCount: number;

  @ApiProperty({
    description: "Number of replies to the comment",
    example: 5,
    type: Number,
  })
  @Expose()
  replyCount: number; // Need for "View n replies" buttons
}

export class CommentResponseDto {
  @ApiProperty({
    description: "Unique identifier of the comment",
    example: "clx1y2z3a0000abcdef123456",
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Content of the comment",
    example: "Great post! Thanks for sharing.",
    type: String,
  })
  @Expose()
  content: string;

  @ApiProperty({
    description: "Array of media URLs attached to the comment",
    example: ["https://example.com/image1.jpg"],
    type: [String],
  })
  @Expose()
  mediaUrls: string[];

  @ApiProperty({
    description: "Date and time when the comment was created",
    example: "2026-02-11T10:30:00Z",
    type: Date,
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "ID of parent comment (null for top-level comments)",
    example: null,
    type: String,
    nullable: true,
  })
  @Expose()
  parentId: string | null; // NULL = Top-level comment

  @ApiProperty({
    description: "Author of the comment",
    type: () => AuthorDto,
  })
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @ApiProperty({
    description: "Whether the requesting user has liked this comment",
    example: false,
    type: Boolean,
  })
  @Expose()
  isLiked: boolean;

  @ApiProperty({
    description: "Comment statistics including likes and replies count",
    type: () => CommentStatsDto,
  })
  @Expose()
  @Type(() => CommentStatsDto)
  stats: CommentStatsDto;
}
