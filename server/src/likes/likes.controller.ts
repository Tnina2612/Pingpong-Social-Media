import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ToggleLikeDto } from "./dto";
import { LikesService } from "./likes.service";

@Controller("likes")
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likeService: LikesService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async toggle(@GetUser("id") id: string, @Body() dto: ToggleLikeDto) {
    return this.likeService.toggleLike(id, dto);
  }
}
