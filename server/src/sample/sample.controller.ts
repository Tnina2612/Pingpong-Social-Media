import { Controller, Get, Query } from "@nestjs/common";
import { GetSampleTextDto } from "./dto/get-sample-text.dto";
import { GetSampleTextResponse } from "./response/get-sample-text.response";
import { SampleService } from "./sample.service";

@Controller("sample")
export class SampleController {
    constructor(private readonly sampleService: SampleService) {}

    @Get()
    async getSampleText(
        @Query() query: GetSampleTextDto,
    ): Promise<GetSampleTextResponse> {
        const text = this.sampleService.getText(query.name);
        return { text };
    }
}
