import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateMessageDto, UpdateMessageDto } from "./dto";
import { MessageService } from "./message.service";

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // POST /api/messages
  @ApiOperation({
    summary: "Create a new message",
    description:
      "Create a new message with optional file attachments in a channel",
  })
  @ApiBody({ type: CreateMessageDto })
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

  // GET /api/messages/:channelId
  @ApiOperation({
    summary: "Get messages in a channel",
    description:
      "Retrieves paginated messages for a channel using cursor-based pagination",
  })
  @ApiParam({ name: "channelId", description: "ID of the channel" })
  @ApiQuery({
    name: "cursor",
    description: "Cursor for pagination (ID of the last fetched message)",
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Messages retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  @Get(":channelId")
  async findByChannel(@Param() channelId: string, @Query() cursor: string) {
    return this.messageService.findByChannel(channelId, cursor);
  }

  // PATCH /api/messages/:messageId
  @ApiOperation({
    summary: "Update a message",
    description:
      "Updates the content of a message. Only the sender can edit their own message.",
  })
  @ApiParam({ name: "messageId", description: "ID of the message to update" })
  @ApiBody({ type: UpdateMessageDto })
  @ApiResponse({ status: 200, description: "Message updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - user is not the message sender",
  })
  @ApiResponse({ status: 404, description: "Message not found" })
  @Patch(":messageId")
  update(
    @Param("messageId") messageId: string,
    @GetUser("id") userId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.update(messageId, userId, updateMessageDto);
  }

  // DELETE /api/messages/:messageId
  @ApiOperation({
    summary: "Delete a message",
    description: "Delete a message using it ID as the parameter of request",
  })
  @ApiResponse({ status: 200, description: "Message deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Message not found" })
  @Delete(":messageId")
  delete(@Param("messageId") messageId: string, @GetUser("id") userId: string) {
    return this.messageService.delete(messageId, userId);
  }

  // TODO: Direct message to another user
}
