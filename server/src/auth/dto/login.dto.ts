import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "Username for login",
    example: "john_doe",
    type: String,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: "Password for login",
    example: "SecurePass123!",
    type: String,
  })
  @IsString()
  password: string;
}
