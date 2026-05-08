export type User = {
  id: string;
  username: string;
  avatar?: string | null | undefined;
  isSpeaking?: boolean;
  hasCompletedOnboarding?: boolean;
};
