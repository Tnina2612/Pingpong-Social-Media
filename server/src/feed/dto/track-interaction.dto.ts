import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";

export enum InteractionType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  DWELL = "DWELL",
}

export class TrackInteractionDto {
  @ApiProperty({
    description: "ID of the post being interacted with",
    example: "550e8400-e29b-41d4-a716-446655440000",
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @ApiProperty({
    description:
      "Type of interaction (LIKE: 1.0 weight, COMMENT: 1.5 weight, DWELL: 0.3 weight)",
    enum: InteractionType,
    example: InteractionType.LIKE,
  })
  @IsEnum(InteractionType)
  @IsNotEmpty()
  type: InteractionType;
}
