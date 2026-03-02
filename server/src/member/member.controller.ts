import { Controller, Delete, Param, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetMember } from "permission/get-member.decorator";
import { PermissionGuard } from "permission/permission.guard";
import { RequirePermission } from "permission/require-permission.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MemberService } from "./member.service";

@ApiTags("Member")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("member")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @ApiOperation({
    summary: "Kick a member from server",
    description:
      "Removes a member from the server. Requires KICK_MEMBER permission.",
  })
  @ApiParam({
    name: "serverId",
    description: "ID of the server",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @ApiParam({
    name: "userId",
    description: "ID of the user to kick",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @ApiResponse({
    status: 200,
    description: "Member kicked successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - insufficient permissions (KICK_MEMBER required)",
  })
  @ApiResponse({
    status: 404,
    description: "Server or member not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @RequirePermission("KICK_MEMBER")
  @UseGuards(PermissionGuard)
  @Delete(":serverId/members/:userId")
  kickMember(
    @Param("serverId") serverId: string,
    @Param("userId") targetUserId: string,
    @GetMember() currentMember: string,
  ) {
    return this.memberService.kickMember(serverId, targetUserId, currentMember);
  }
}
