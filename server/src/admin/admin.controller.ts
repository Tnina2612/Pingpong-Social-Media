import { RequireGlobalRoles } from "@libs/common/decorators";
import { Controller, Delete, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { GlobalRole } from "@prisma/client";
import { GlobalRolesGuard, JwtAuthGuard } from "src/auth/guards";
import { AdminService } from "./admin.service";

@ApiTags("Administrator")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, GlobalRolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Accessible by Moderators and Super Admins
  @Get("users")
  @RequireGlobalRoles(GlobalRole.MODERATOR, GlobalRole.SUPER_ADMIN)
  getAllPlatformUsers() {
    // Logic to list all users
    return this.adminService.getAllPlatformUsers();
  }

  // Accessible ONLY by Super Admins
  @Delete("users/:userId/ban")
  @RequireGlobalRoles(GlobalRole.SUPER_ADMIN)
  banUserGlobally(@Param("userId") userId: string) {
    // Logic to permanently ban a user from the entire application
    return this.adminService.banUserGlobally(userId);
  }

  // Accessible by Moderators and Super Admins
  @Delete("posts/:postId")
  @RequireGlobalRoles(GlobalRole.MODERATOR, GlobalRole.SUPER_ADMIN)
  deleteAnyPost(@Param("postId") postId: string) {
    // Logic to delete an inappropriate post, regardless of who authored it
    return this.adminService.deleteAnyPost(postId);
  }
}
