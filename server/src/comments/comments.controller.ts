import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CommentResponseDto } from "./response";

@ApiTags("Comments")
@ApiBearerAuth()
@Controller("comments")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // POST /api/comments
  @ApiOperation({
    summary: "Create a comment or reply",
    description:
      "Creates a new comment on a post or reply to an existing comment",
  })
  @ApiResponse({
    status: 201,
    description: "Comment created successfully",
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid input - content cannot be empty or invalid postId/parentId",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @ApiResponse({
    status: 404,
    description: "Not found - missing post or parent comment",
  })
  @Post()
  create(@GetUser("id") userId: string, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(userId, dto);
  }

  // GET /api/comments/post/:postId?page=1
  @ApiOperation({
    summary: "Get comments for a post",
    description:
      "Retrieves paginated top-level comments for the specified post",
  })
  @ApiParam({
    name: "postId",
    description: "ID of the post",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiQuery({
    name: "page",
    description: "Page number for pagination",
    example: 1,
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: "Comments retrieved successfully",
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Get("post/:postId")
  findByPost(
    @GetUser("id") userId: string,
    @Param("postId") postId: string,
    @Query("page") page: number = 1,
  ) {
    return this.commentsService.findByPost(postId, userId, page);
  }

  // GET /api/comments/:commentId/replies
  @ApiOperation({
    summary: "Get replies to a comment",
    description: "Retrieves all replies for a specific comment",
  })
  @ApiParam({
    name: "commentId",
    description: "ID of the parent comment",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiResponse({
    status: 200,
    description: "Replies retrieved successfully",
    type: [CommentResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @Get(":commentId/replies")
  findReplies(
    @GetUser("id") userId: string,
    @Param("commentId") commentId: string,
  ) {
    return this.commentsService.findReplies(commentId, userId);
  }
}
