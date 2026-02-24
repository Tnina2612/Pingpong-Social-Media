import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: "Name of the server",
    example: "My Gaming Server",
  })
  name: string;
}
