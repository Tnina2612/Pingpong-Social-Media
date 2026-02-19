import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";
import { CloudinaryResponse } from "./response";

@Injectable()
export class CloudinaryService {
  // Generic upload for both Images and Videos
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Pingpong-uploads",
          resource_type: "auto",
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
    return cloudinary.uploader.destroy(publicId);
  }
}
