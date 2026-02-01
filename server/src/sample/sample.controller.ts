import { Controller, Get, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { GetSampleTextDto } from "./dto";
import { GetSampleTextResponse } from "./response";
import { SampleService } from "./sample.service";

@Controller("sample")
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @ApiOperation({
    summary: "Get sample text",
    description: "Returns a formatted text string with the provided name",
  })
  @ApiResponse({
    status: 200,
    description: "Sample text retrieved successfully",
    type: GetSampleTextResponse,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input - name must be a string",
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getSampleText(
    @Query() query: GetSampleTextDto,
  ): Promise<GetSampleTextResponse> {
    const text = this.sampleService.getText(query.name);
    return { text };
  }
}
