import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    description: "Email address associated with the user account",
    example: "john.doe@example.com",
    type: String,
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email cannot be empty" })
  email: string;

  @ApiProperty({
    description: "New password for the account",
    example: "SecurePass123!",
    minLength: 8,
    type: String,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty({ message: "Password cannot be empty" })
  newPassword: string;

  @ApiProperty({
    description: "One-time password received via email",
    example: "123456",
    minLength: 6,
    type: String,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty({ message: "OTP cannot be empty" })
  otp: string;
}
