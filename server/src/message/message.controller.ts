import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateMessageDto } from "./dto";
import { MessageService } from "./message.service";

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({
    summary: "Create a new message",
    description:
      "Create a new message with optional file attachments in a channel",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: CreateMessageDto,
  })
  @ApiResponse({
    status: 201,
    description: "Message created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  @Post()
  async create(@GetUser("id") userId: string, @Body() dto: CreateMessageDto) {
    return this.messageService.create(userId, dto);
  }

  @Get(":channelId")
  async findByChannel(@Param() channelId: string, @Query() cursor: string) {
    return this.messageService.findByChannel(channelId, cursor);
  }

  // TODO: update message endpoint
  // TODO: delete message endpoint
  // TODO: Direct message to another user
}
