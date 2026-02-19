import { Expose } from "class-transformer";

export class UploadResponseDto {
  @Expose()
  url: String;

  @Expose()
  publicId: String;

  @Expose()
  type: "image" | "video";
}
