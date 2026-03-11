export enum ServerPermission {
  ADMINISTRATOR   = 1 << 0, // 1  (Binary: 0000001)
  MANAGE_SERVER   = 1 << 1, // 2  (Binary: 0000010)
  MANAGE_CHANNELS = 1 << 2, // 4  (Binary: 0000100)
  KICK_MEMBERS    = 1 << 3, // 8  (Binary: 0001000)
  BAN_MEMBERS     = 1 << 4, // 16 (Binary: 0010000)
  SEND_MESSAGES   = 1 << 5, // 32 (Binary: 0100000)
  MANAGE_MESSAGES = 1 << 6, // 64 (Binary: 1000000)
}
