import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreatePostDto } from "./dto";
import { PostsService } from "./posts.service";
import { PostResponseDto } from "./response";

@ApiTags("Posts")
@ApiBearerAuth()
@Controller("posts")
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postService: PostsService) {}

  // GET /api/posts
  @ApiOperation({
    summary: "Get user feed",
    description:
      "Retrieves posts from users that the authenticated user follows",
  })
  @ApiResponse({
    status: 200,
    description: "Posts retrieved successfully",
    type: [PostResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Get()
  async getFeed(@GetUser("id") id: string) {
    return this.postService.findAll(id);
  }

  // POST /api/posts
  @ApiOperation({
    summary: "Create a new post",
    description: "Creates a new post with optional media attachments",
  })
  @ApiResponse({
    status: 201,
    description: "Post created successfully",
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input - content cannot be empty",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Post()
  async createPost(@GetUser("id") id: string, @Body() dto: CreatePostDto) {
    return this.postService.create(id, dto);
  }
}
