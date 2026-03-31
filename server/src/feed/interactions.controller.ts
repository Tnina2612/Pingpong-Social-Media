import { GetUser } from "@libs/common/decorators";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TrackInteractionDto } from "./dto";
import { TasksService } from "./tasks.service";

@ApiTags("interactions")
@ApiBearerAuth()
@Controller("interactions")
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({
    summary: "Track user interaction with a post",
    description:
      "Records a user interaction (like, comment, dwell) with a post and pushes a vector update job to the ML worker for feed personalization. Weights: LIKE=1.0, COMMENT=1.5, DWELL=0.3",
  })
  @ApiBody({ type: TrackInteractionDto })
  @ApiResponse({
    status: 201,
    description: "Interaction tracked and queued for processing",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "tracked" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid interaction data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  async trackInteraction(
    @GetUser("id") userId: string,
    @Body() dto: TrackInteractionDto,
  ) {
    const weights = { LIKE: 1.0, COMMENT: 1.5, DWELL: 0.3 };
    const weight = weights[dto.type];

    // Push the update job to the Python ML worker silently
    await this.tasksService.enqueueVectorUpdate(userId, dto.postId, weight);

    return { status: "tracked" };
  }
}
