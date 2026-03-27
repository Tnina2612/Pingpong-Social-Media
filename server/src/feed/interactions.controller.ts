import { GetUser } from "@libs/common/decorators";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TasksService } from "./tasks.service";

@Controller("interactions")
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async trackInteraction(
    @GetUser("id") userId: string,
    @Body("postId") postId: string,
    @Body("type") type: "LIKE" | "COMMENT" | "DWELL",
  ) {
    const weights = { LIKE: 1.0, COMMENT: 1.5, DWELL: 0.3 };
    const weight = weights[type];

    // Push the update job to the Python ML worker silently
    await this.tasksService.enqueueVectorUpdate(userId, postId, weight);

    return { status: "tracked" };
  }
}
