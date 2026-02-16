import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ToggleLikeDto } from "./dto";
import { LikesService } from "./likes.service";

@ApiTags("likes")
@ApiBearerAuth()
@Controller("likes")
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likeService: LikesService) {}

  @ApiOperation({
    summary: "Toggle like on post or comment",
    description:
      "Adds a like if not already liked, removes like if already liked",
  })
  @ApiResponse({
    status: 200,
    description: "Like toggled successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input - invalid targetId or type",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @HttpCode(HttpStatus.OK)
  @Post()
  async toggle(@GetUser("id") id: string, @Body() dto: ToggleLikeDto) {
    return this.likeService.toggleLike(id, dto);
  }
}
