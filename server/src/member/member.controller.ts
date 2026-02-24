import { Controller, Delete, Param, UseGuards } from "@nestjs/common";
import { MemberService } from "./member.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RequirePermission } from "permission/require-permission.decorator";
import { PermissionGuard } from "permission/permission.guard";
import { GetUser } from "src/auth/decorators/get-user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("member")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @RequirePermission("KICK_MEMBER")
  @UseGuards(PermissionGuard)
  @Delete(":serverId/members/:userId")
  kickMember(
    @Param("serverId") serverId: string,
    @Param("userId") targetUserId: string,
    @GetUser("id") currentUserId: string,
  ) {
    return this.memberService.kickMember(serverId, targetUserId, currentUserId);
  }
}
