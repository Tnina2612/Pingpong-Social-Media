import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { RegisterDto } from "./dto/register.dto";
import * as brypt from "bcrypt";
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const hash = await brypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hash,
      },
    });
    return this.signToken(user.id);
  }
  private async signToken(userId: string) {
    const payload = { sub: userId };
    return {
      access_token: this.jwt.signAsync(payload),
    };
  }
}
