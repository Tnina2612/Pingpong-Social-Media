import { randomInt } from "node:crypto";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Response } from "express";
import Redis from "ioredis";
import { MailService } from "src/mail/mail.service";
import { PrismaService } from "src/prisma/prisma.service";
import { LoginDto, RegisterDto, VerifyOtpDto } from "./dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    @Inject("REDIS") private redis: Redis,
  ) {}

  private async signToken(userId: string) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN") || "7d",
      }),
    ]);
    await this.updateRefreshToken(userId, refreshToken);
    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private generateOtp() {
    return randomInt(100000, 1000000).toString();
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
    await this.redis.set(`email:otp:${dto.email}`, hashedOtp, "EX", 300);
    await this.mail.sendOtpMail(dto.email, otp);

    return { message: "OTP is sent to email" };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new ForbiddenException("Invalid credentials");
    }
    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new ForbiddenException("Password is incorrect");
    if (!user.isActivated) {
      await this.resendOtp(dto.email);
      throw new ForbiddenException(
        "Email is not activated, please fill otp sent to your email",
      );
    }
    const tokens = await this.signToken(user.id);
    return {
      user: {
        id: user?.id,
        username: user.username,
        avatar: user?.avatar,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new ForbiddenException("No refresh token");
    }
    const payload = await this.jwt.verify(refreshToken, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET"),
    });
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshToken) {
      throw new ForbiddenException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new ForbiddenException("Invalid credentials");
    }

    const tokens = await this.signToken(user.id);
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

  async logout(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    res.clearCookie("refreshToken", {
      path: "/auth/refresh",
    });
    return { message: "Logged out" };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otpKey = `email:otp:${dto.email}`;
    const attemptKey = `otp:verify:${dto.email}`;
    const attempts = await this.redis.incr(attemptKey);

    if (attempts === 1) {
      await this.redis.expire(attemptKey, 300);
    }
    if (attempts > 5) {
      throw new ForbiddenException("Too many attempts. Please try again later");
    }
    const storedOtp = await this.redis.get(otpKey);

    if (!storedOtp) {
      throw new ForbiddenException("OTP expired or invalid");
    }

    const isValid = await bcrypt.compare(dto.otp, storedOtp);
    if (!isValid) {
      throw new ForbiddenException("Invalid OTP");
    }
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { isActivated: true },
    });

    await this.redis.del(otpKey);
    await this.redis.del(attemptKey);
    return { message: "Email verified successfully" };
  }

  async resendOtp(email: string) {
    const resendKey = `otp:resend:${email}`;
    const otpKey = `email:otp:${email}`;

    const isCoolDown = await this.redis.get(resendKey);
    if (isCoolDown) {
      throw new ForbiddenException("Please wait before requesting another OTP");
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ForbiddenException("User not found");
    }
    if (user.isActivated) {
      throw new ForbiddenException("Email is already activated");
    }
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.redis.set(otpKey, hashedOtp, "EX", 300);
    await this.redis.set(resendKey, "1", "EX", 60);
    await this.mail.sendOtpMail(email, otp);

    return { message: "OTP resent successfully" };
  }

  async requestResetPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new ForbiddenException("User not found");
    }
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await this.redis.set(`reset:otp:${email}`, hashedOtp, "EX", 300);
    await this.mail.sendOtpMail(email, otp);
    return { message: "Reset-password OTP is sent to email" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const otpKey = `reset:otp:${dto.email}`;
    const attemptKey = `reset:attempt:${dto.email}`;

    const attempts = await this.redis.incr(attemptKey);
    if (attempts === 1) {
      await this.redis.expire(attemptKey, 300);
    }
    if (attempts > 5) {
      throw new ForbiddenException("Too many attempts. Please try again later");
    }
    const storedOtp = await this.redis.get(otpKey);
    if (!storedOtp) {
      throw new ForbiddenException("OTP expired or invalid");
    }
    const isValid = await bcrypt.compare(dto.otp, storedOtp);
    if (!isValid) {
      throw new ForbiddenException("Invalid OTP");
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password: hashedPassword, refreshToken: null },
    });

    return { message: "Password reset successfully" };
  }
}
