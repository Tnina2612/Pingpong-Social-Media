import { PickType } from "@nestjs/swagger";
import { UserResponseDto } from "../response";

export class AuthorDto extends PickType(UserResponseDto, [
  "id",
  "username",
  "avatar",
] as const) {}
