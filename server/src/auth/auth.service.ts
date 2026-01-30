import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { PrismaService } from "src/prisma/prisma.service";
import Redis from "ioredis";
import { MailService } from "src/mail/mail.service";
import { VerifyOtpDto } from "./dto/verifyotp.dto";
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
    @Inject("REDIS") private redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await this.prisma.user.create({
      data: {
        ...dto,
        password: hash,
      },
    });

    await this.redis.set(`email:otp:${dto.email}`, otpHash, "EX", 300);

    await this.mail.sendOtpMail(dto.email, otp);
    return { message: "OTP is sent to email" };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });
    if (!user || !user.isActivate) {
      throw new ForbiddenException("Invalid credentials");
    }
    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new ForbiddenException("Invalid credentials");
    return this.signToken(user.id);
  }

  private async signToken(userId: string) {
    const payload = { sub: userId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>("JWT_REFRESH_TOKEN"),
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
  async refreshToken(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new ForbiddenException("No fresh token");
    }
    const payload = await this.jwt.verify(refreshToken, {
      secret: this.config.get<string>("JWT_REFRESH_TOKEN"),
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
      secure: false,
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
      data: { isActivate: true },
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
    if (user.isActivate) {
      throw new ForbiddenException("Email is already activated");
    }
    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.redis.set(otpKey, otpHash, "EX", 300);
    await this.redis.set(resendKey, "1", "EX", 60);
    await this.mail.sendOtpMail(email, otp);

    return { message: "OTP resent successfully" };
  }
  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
