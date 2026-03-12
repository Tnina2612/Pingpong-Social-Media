export interface WsJoinChannelPayload {
  serverId: string; // Required for the Guard
  channelId: string;
}

export interface WsLeaveChannelPayload {
  serverId: string; // Required for the Guard
  channelId: string;
}
