import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
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
  @ApiBody({
    type: CreatePostDto,
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

  // GET /api/posts/:postId
  @ApiOperation({
    summary: "Get post by ID",
    description: "Retrieves a specific post by its unique identifier",
  })
  @ApiParam({
    name: "postId",
    description: "ID of the post",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Post retrieved successfully",
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Post not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Get("/:postId")
  async findById(
    @GetUser("id") userId: string,
    @Param("postId") postId: string,
  ) {
    return this.postService.findById(postId, userId);
  }

  // DELETE /api/posts/:postId
  @ApiOperation({
    summary: "Delete a post",
    description:
      "Deletes a post by its ID. Only the post author can delete their own post.",
  })
  @ApiParam({
    name: "postId",
    description: "ID of the post to delete",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Post deleted successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - user is not the author of the post",
  })
  @ApiResponse({
    status: 404,
    description: "Post not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Delete("/:postId")
  async deletePost(
    @GetUser("id") userId: string,
    @Param("postId") postId: string,
  ) {
    return this.postService.deletePost(postId, userId);
  }
}
