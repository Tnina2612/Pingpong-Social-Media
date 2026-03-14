import { Injectable, NotImplementedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPlatformUsers() {
    throw new NotImplementedException();
  }

  async banUserGlobally(userId: string) {
    throw new NotImplementedException();
  }

  async deleteAnyPost(postId: string) {
    throw new NotImplementedException();
  }
}
