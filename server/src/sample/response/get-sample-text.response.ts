import { ApiProperty } from "@nestjs/swagger";

export class GetSampleTextResponse {
    @ApiProperty({
        description: "The formatted sample text",
        example: "This is a sample service for NestJS",
        type: String,
    })
    text: string;
}
