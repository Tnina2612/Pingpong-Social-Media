import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class GetSampleTextDto {
  @ApiProperty({
    description: "Name to include in the sample text",
    example: "NestJS",
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Name cannot be empty" })
  @MinLength(1, { message: "Name must be at least 1 character" })
  @MaxLength(50, { message: "Name cannot exceed 50 characters" })
  name: string;
}
