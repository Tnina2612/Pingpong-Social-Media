import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { AttachmentDto } from "src/posts/dto";
import { AuthorDto } from "src/users/dto";

export class ReactionGroupDto {
  icon: string;
  count: number;
  users: AuthorDto[];
}

export class MessageResponseDto {
  @ApiProperty({
    description: "Unique identifier of the message",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Date and time when the message was sent",
    example: "2026-03-07T10:30:00Z",
    type: Date,
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Whether the message has been deleted",
    example: false,
    type: Boolean,
  })
  @Expose()
  deleted: boolean;

  @ApiProperty({
    description: "Content of the message",
    example: "Just shared an amazing photo from my vacation!",
    type: String,
  })
  @Expose()
  content?: string;

  @ApiProperty({
    description: "Array of media attachments for the message",
  })
  @Expose()
  attachments: AttachmentDto[];

  @ApiProperty({
    description: "The message being replied to",
    required: false,
    nullable: true,
  })
  @Expose()
  replyTo?: {
    id: string;
    content?: string;
  };

  @ApiProperty({
    description: "Sender of the message",
    type: () => AuthorDto,
  })
  @Expose()
  @Type(() => AuthorDto)
  sender: AuthorDto;

  @Expose()
  reactions: [ReactionGroupDto];
}
