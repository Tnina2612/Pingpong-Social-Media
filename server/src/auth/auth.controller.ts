import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { GetUser } from "./decorators/get-user.decorator";
import { LoginDto, RegisterDto, VerifyOtpDto } from "./dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshGuard } from "./guards/refresh.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @ApiOperation({
    summary: "Register a new user",
    description:
      "Creates a new user account and sends verification OTP to email",
  })
  @ApiResponse({
    status: 201,
    description: "User registered successfully, OTP sent to email",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input or user already exists",
  })
  @HttpCode(HttpStatus.CREATED)
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({
    summary: "Login user",
    description:
      "Authenticates user and returns access token with refresh token in cookie",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful, tokens generated",
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
  })
  @HttpCode(HttpStatus.OK)
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

  @ApiOperation({
    summary: "Refresh access token",
    description: "Generates new access token using refresh token from cookie",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
  })
  @ApiResponse({
    status: 401,
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

  @ApiOperation({
    summary: "Resend OTP",
    description: "Resends verification OTP to the specified email address",
  })
  @ApiResponse({
    status: 200,
    description: "OTP resent successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid email or user not found",
  })
  @HttpCode(HttpStatus.OK)
  @Post("resend-otp")
  resendOtp(@Body("email") email: string) {
    return this.authService.resendOtp(email);
  }
}
