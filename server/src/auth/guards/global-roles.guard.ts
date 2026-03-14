import { GLOBAL_ROLES_KEY } from "@libs/common/decorators";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GlobalRole } from "@prisma/client";

@Injectable()
export class GlobalRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<GlobalRole[]>(
      GLOBAL_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the route doesn't require specific global roles, let anyone through
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // The user object should be populated by your JwtAuthGuard
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException("Access denied: Missing global role");
    }

    // Check if the user's role is included in the required roles
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        "Access denied: System Administrator privileges required",
      );
    }

    return true;
  }
}
