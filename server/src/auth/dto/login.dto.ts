import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    description: "Email for login",
    example: "john_doe@example.com",
    type: String,
  })
  @IsEmail()
  @IsNotEmpty({ message: "Email cannot be empty" })
  email: string;

  @ApiProperty({
    description: "Password for login",
    example: "SecurePass123!",
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: "Password cannot be empty" })
  password: string;
}
