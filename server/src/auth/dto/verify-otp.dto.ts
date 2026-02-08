import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({
    description: "Email address to verify",
    example: "john.doe@example.com",
    type: String,
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email cannot be empty" })
  email: string;

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
