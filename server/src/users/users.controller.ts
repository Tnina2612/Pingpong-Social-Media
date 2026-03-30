import { GetUser } from "@libs/common/decorators";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards";
import { SetInitialInterestsDto } from "./dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @ApiOperation({
    summary: "Set onboarding interests",
    description:
      "Saves selected onboarding topics and triggers background vector initialization for feed personalization.",
  })
  @ApiBody({ type: SetInitialInterestsDto })
  @ApiResponse({
    status: 201,
    description: "Interests submitted and personalization process started",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "success" },
        message: {
          type: "string",
          example: "Feed is being personalized",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid topics payload" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post("onboarding/interests")
  async setInitialInterests(
    @GetUser("id") userID: string,
    @Body() dto: SetInitialInterestsDto,
  ) {
    // Fire off the background job to the Python worker
    await this.userService.triggerVectorInitialization(userID, dto.topics);
    return { status: "success", message: "Feed is being personalized" };
  }
}
