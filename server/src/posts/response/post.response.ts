import { Expose, Type } from "class-transformer";
import { UserResponseDto } from "../../users/response/user.response";

export class PostStatsDto {
  @Expose()
  likeCount: number;

  @Expose()
  commentCount: number;
}

export class PostResponseDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  mediaUrls: string[];

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => UserResponseDto)
  author: UserResponseDto;

  // Computed Fields
  @Expose()
  isLiked: boolean; // TRUE if the requesting user has liked it

  @Expose()
  @Type(() => PostStatsDto)
  stats: PostStatsDto;
}
