import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export enum LikeTargetType {
  POST = "POST",
  COMMENT = "COMMENT",
}

export class ToggleLikeDto {
  @ApiProperty({
    description: "ID of the target (post or comment) to like/unlike",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({
    description: "Type of target being liked",
    enum: LikeTargetType,
    example: LikeTargetType.POST,
  })
  @IsEnum(LikeTargetType)
  type: LikeTargetType;
}
