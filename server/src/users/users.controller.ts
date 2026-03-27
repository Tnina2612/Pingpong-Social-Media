import { GetUser } from "@libs/common/decorators";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post("onboarding/interests")
  async setInitialInterests(
    @GetUser("id") userID: string,
    @Body("topics") topics: string[], // e.g., ["Sports", "Music"]
  ) {
    // Fire off the background job to the Python worker
    await this.userService.triggerVectorInitialization(userID, topics);
    return { status: "success", message: "Feed is being personalized" };
  }
}
