import { Injectable, NotFoundException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";
import { CloudinaryResponse } from "./response";

@Injectable()
export class CloudinaryService {
  // Generic upload for both Images and Videos
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      let resourceType: "image" | "video";
      if (file.mimetype.startsWith("image/")) {
        resourceType = "image";
      } else if (file.mimetype.startsWith("video/")) {
        resourceType = "video";
      } else {
        return reject(new Error("Unsupported file type"));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Pingpong-uploads",
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed: no result"));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // Helper to delete files (e.g., when a user deletes a post)
  async deleteFile(publicId: string) {
    if (!publicId) {
      throw new Error("publicId is required");
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);

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
