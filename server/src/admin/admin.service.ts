import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPlatformUsers() {}

  async banUserGlobally(userId: string) {}

  async deleteAnyPost(postId: string) {}
}
