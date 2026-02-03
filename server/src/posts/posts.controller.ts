import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreatePostDto } from "./dto";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postService: PostsService) {}

  // GET /api/posts
  @UseGuards(JwtAuthGuard)
  @Get()
  async getFeed(@GetUser("id") id: string) {
    return this.postService.findAll(id);
  }

  // POST /api/posts
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(@GetUser("id") id: string, @Body() dto: CreatePostDto) {
    return this.postService.create(id, dto);
  }
}
