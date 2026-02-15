import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { GetUser } from "./decorators/get-user.decorator";
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from "./dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshGuard } from "./guards/refresh.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  // POST /api/auth/register
  @ApiOperation({
    summary: "Register a new user",
    description:
      "Creates a new user account and sends verification OTP to email. Returns generic error if registration fails to prevent user enumeration.",
  })
  @ApiResponse({
    status: 201,
    description: "User registered successfully, OTP sent to email",
  })
  @ApiResponse({
    status: 403,
    description: "Registration failed - check your details",
  })
  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/auth/login
  @ApiOperation({
    summary: "Login user",
    description:
      "Authenticates user and returns access token, user payload with refresh token in cookie",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful, tokens generated and user payload returned",
  })
  @ApiResponse({
    status: 403,
    description: "Invalid credentials",
  })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(dto);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: this.config.get<string>("NODE_ENV") === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
    });
    return {
      user,
      accessToken,
    };
  }

  // POST /api/auth/refresh
  @ApiOperation({
    summary: "Refresh access token",
    description: "Generates new access token using refresh token from cookie",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Invalid or expired refresh token",
  })
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  @UseGuards(RefreshGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refreshToken;
    return this.authService.refreshToken(refreshToken, res);
  }

  // POST /api/auth/logout
  @ApiOperation({
    summary: "Logout user",
    description: "Invalidates user session and clears refresh token cookie",
  })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - invalid or missing token",
  })
  @HttpCode(HttpStatus.OK)
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @GetUser("id") userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(userId, res);
  }

  // POST /api/auth/verify-otp
  @ApiOperation({
    summary: "Verify OTP",
    description: "Verifies the OTP sent to user's email during registration",
  })
  @ApiResponse({
    status: 200,
    description: "OTP verified successfully, account activated",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid or expired OTP",
  })
  @HttpCode(HttpStatus.OK)
  @Post("verify-otp")
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // POST /api/auth/resend-otp
  @ApiOperation({
    summary: "Resend OTP",
    description:
      "Resends verification OTP to the specified email address. Returns generic success message regardless of user existence to prevent enumeration. Enforces 60-second cooldown.",
  })
  @ApiResponse({
    status: 200,
    description:
      "Generic success response - OTP sent if email is registered and not activated",
  })
  @ApiResponse({
    status: 403,
    description: "Cooldown active - please wait before requesting another OTP",
  })
  @HttpCode(HttpStatus.OK)
  @Post("resend-otp")
  resendOtp(@Body() dto: EmailDto) {
    return this.authService.resendOtp(dto.email);
  }

  //POST /api/auth/request-reset-password
  @ApiOperation({
    summary: "Request password reset",
    description:
      "Sends password reset OTP to the specified email address. Returns generic success message regardless of user existence to prevent enumeration. Enforces 60-second cooldown.",
  })
  @ApiResponse({
    status: 200,
    description: "Generic success response - OTP sent if email is registered",
  })
  @ApiResponse({
    status: 403,
    description: "Cooldown active - please wait before requesting another OTP",
  })
  @HttpCode(HttpStatus.OK)
  @Post("request-reset-password")
  requestReset(@Body() dto: EmailDto) {
    return this.authService.requestResetPassword(dto.email);
  }

  // POST /api/auth/reset-password
  @ApiOperation({
    summary: "Reset Password",
    description:
      "Resets password using OTP verification. Requires valid OTP from request-reset-password endpoint. Rate limited to 5 attempts per 5 minutes.",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
  })
  @ApiResponse({
    status: 403,
    description:
      "Invalid or expired OTP, or too many attempts (max 5 per 5 minutes)",
  })
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
