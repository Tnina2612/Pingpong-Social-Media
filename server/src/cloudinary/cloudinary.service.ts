import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";
import { CloudinaryResponse } from "./response";

@Injectable()
export class CloudinaryService {
  // Generic upload for both Images and Videos
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      let resourceType: "image" | "video" | "raw" | "auto" = "auto";
      if (file.mimetype.startsWith("image/")) {
        resourceType = "image";
      } else if (
        file.mimetype.startsWith("video/") ||
        file.mimetype.startsWith("audio/")
      ) {
        resourceType = "video";
      } else {
        resourceType = "raw"; // PDFs, ZIPs, DOCX, etc.
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Pingpong-uploads",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            return reject(
              new BadRequestException(`Cloudinary Error: ${error.message}`),
            );
          }
          if (!result) return reject(new Error("Upload failed: no result"));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // Helper to delete files (e.g., when a user deletes a post)
  async deleteFile(publicId: string, resourceType: "image" | "video" | "raw") {
    if (!publicId) {
      throw new BadRequestException("publicId is required");
    }

    try {
      // When deleting, Cloudinary needs to know the resource_type if it's not an image
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      // Cloudinary returns { result: 'ok' } or { result: 'not found' }
      if (!result || result.result !== "ok") {
        if (result?.result === "not found") {
          throw new NotFoundException(
            `File with publicId "${publicId}" does not exist`,
          );
        }
        throw new Error(`Failed to delete file with publicId "${publicId}"`);
      }

      return result;
    } catch (error: any) {
      throw new Error(
        `Error deleting file with publicId "${publicId}": ${error.message || "Unknown error"}`,
      );
    }
  }
}
