import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AttachmentStatus, AttachmentType } from "@prisma/client";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AttachmentCleanupService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanTempAttachments() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const attachments = await this.prisma.attachment.findMany({
      where: {
        status: AttachmentStatus.TEMP,
        createdAt: {
          lt: fiveMinutesAgo,
        },
      },
    });

    if (!attachments.length) return;

    await Promise.all(
      attachments.map((a) => {
        let resourceType: "image" | "video" | "raw" = "image";

        if (a.type === AttachmentType.FILE) resourceType = "raw";
        if (a.type === AttachmentType.VIDEO || a.type === AttachmentType.AUDIO)
          resourceType = "video";

        return this.cloudinary.deleteFile(a.publicId, resourceType);
      }),
    );

    await this.prisma.attachment.deleteMany({
      where: {
        id: {
          in: attachments.map((a) => a.id),
        },
      },
    });
  }
}
