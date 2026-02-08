import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    description: "Email address for registration",
    example: "john.doe@example.com",
    type: String,
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email cannot be empty" })
  email: string;

  @ApiProperty({
    description: "Username for the new account",
    example: "john_doe",
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: "Username cannot be empty" })
  username: string;

  @ApiProperty({
    description: "Password for the new account",
    example: "SecurePass123!",
    minLength: 8,
    type: String,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty({ message: "Password cannot be empty" })
  password: string;
}
