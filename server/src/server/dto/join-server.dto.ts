import { IsNotEmpty, IsString } from "class-validator";

export class JoinServerDto {
  @IsNotEmpty()
  @IsString()
  serverId: string;
}
