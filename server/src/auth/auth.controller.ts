import { Controller, Body, Post, UseGuards, Res, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshGuard } from "./guards/refresh.guard";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GetUser } from "./decorators/get-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto);
    res.cookie("refeshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "auth/refresh",
    });
    return {
      accessToken: tokens.accessToken,
    };
  }

  @Post("refresh")
  @UseGuards(RefreshGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies["refreshToken"];
    return this.authService.refreshToken(refreshToken, res);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @GetUser("id") userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(userId, res);
  }
}
