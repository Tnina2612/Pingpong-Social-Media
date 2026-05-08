import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsString } from "class-validator";

export class SetInitialInterestsDto {
  @ApiProperty({
    description: "List of topics selected by the user during onboarding",
    example: ["Sports", "Music", "Technology"],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  topics: string[] = [];
}
