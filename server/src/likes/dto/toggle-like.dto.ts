import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";

export enum LikeTargetType {
  POST = "POST",
  COMMENT = "COMMENT",
}

export class ToggleLikeDto {
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @IsEnum(LikeTargetType)
  type: LikeTargetType;
}
