import { IsEmail, MinLength } from "class-validator";

export class VerifyOtpDto {
  @IsEmail()
  email: string;
  @MinLength(6)
  otp: string;
}
