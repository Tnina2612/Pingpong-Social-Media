import { ServerPermission } from "@libs/common/enums/server-permissions.enum";
import { SetMetadata } from "@nestjs/common";

export const REQUIRE_PERMISSION_KEY = "require_permission";

export const RequirePermission = (...permission: ServerPermission[]) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);
