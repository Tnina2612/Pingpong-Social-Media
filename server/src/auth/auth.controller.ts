import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { GetUser } from "./decorators/get-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { VerifyOtpDto } from "./dto/verifyotp.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshGuard } from "./guards/refresh.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

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
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.get<string>("NODE_ENV") === "production",
      sameSite: "strict",
      path: "/auth/refresh",
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
    const refreshToken = req.cookies.refreshToken;
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

  @Post("verify-otp")
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post("resend-otp")
  resendOtp(@Body("email") email: string) {
    return this.authService.resendOtp(email);
  }
}
