import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MinLength } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({
    description: "Email address to verify",
    example: "john.doe@example.com",
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "One-time password received via email",
    example: "123456",
    minLength: 6,
    type: String,
  })
  @MinLength(6)
  otp: string;
}
