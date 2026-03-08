import type { User } from "./user";

export interface CreateServerProps {
  name: string;
  iconUrl?: string;
}

export interface ServerType {
  id: string;
  name: string;
  iconUrl: string | null;
  owner: User;
  stats: {
    channelCount: number;
    memberCount: number;
  };
}
