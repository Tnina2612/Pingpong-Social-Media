import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Password cannot be empty" })
  newPassword: string;

  @MinLength(6)
  @IsNotEmpty({ message: "OTP cannot be empty" })
  otp: string;
}
