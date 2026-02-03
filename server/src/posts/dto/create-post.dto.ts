import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: "Content cannot be empty" })
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsUrl({}, { each: true })
  @IsOptional()
  mediaUrls?: string[];
}
