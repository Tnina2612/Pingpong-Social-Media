import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryService } from "./cloudinary.service";

@Global()
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: this.config.get<string>("CLOUDINARY_API_KEY"),
      api_secret: this.config.get<string>("CLOUDINARY_API_SECRET"),
    });
  }
}
