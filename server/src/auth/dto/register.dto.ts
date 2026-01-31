import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "Email address for registration",
    example: "john.doe@example.com",
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Username for the new account",
    example: "john_doe",
    type: String,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: "Password for the new account",
    example: "SecurePass123!",
    minLength: 6,
    type: String,
  })
  @MinLength(6)
  password: string;
}
