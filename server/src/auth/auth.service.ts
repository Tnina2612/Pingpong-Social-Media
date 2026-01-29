import { ForbiddenException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { PrismaService } from "src/prisma/prisma.service";
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hash,
      },
    });
    return this.signToken(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: dto.username,
      },
    });
    if (!user) {
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
}
