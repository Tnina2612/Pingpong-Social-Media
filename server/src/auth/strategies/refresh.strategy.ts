import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refreshToken,
      ]),
      secretOrKey: config.get<string>("JWT_REFRESH_TOKEN") || "",
    });
  }
  validate(payload: { sub: string }) {
    return payload;
  }
}
