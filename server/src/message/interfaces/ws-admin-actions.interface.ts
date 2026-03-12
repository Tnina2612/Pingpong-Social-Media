export interface WsDeleteMessagePayload {
  serverId: string; // Required for the Guard
  channelId: string;
  messageId: string;
}

export interface WsKickMemberPayload {
  serverId: string; // Required for the Guard
  memberId: string; // The ID of the user being kicked
}
