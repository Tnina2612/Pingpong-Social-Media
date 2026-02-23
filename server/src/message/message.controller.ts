import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { MessageService } from "./message.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { CreateMessageDto } from "./dto/create-message.dto";

@ApiTags("messages")
@ApiBearerAuth()
@Controller("message")
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @UseInterceptors(FileInterceptor("files"))
  @ApiOperation({ summary: "Create a new message in a channel" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Create message with optional file attachments",
    schema: {
      type: "object",
      properties: {
        channelId: { type: "string", format: "uuid" },
        content: { type: "string", maxLength: 4000 },
        replyToId: { type: "string", format: "uuid" },
        files: {
          type: "string",
          format: "binary",
        },
      },
      required: ["channelId"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Message created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  async create(
    @GetUser("id") userId: string,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.messageService.create(userId, dto, files);
  }
}
