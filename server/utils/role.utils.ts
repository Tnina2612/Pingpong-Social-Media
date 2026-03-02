export function getHighestRolePosition(member: any): number {
  if (!member.roles || member.roles.length === 0) return 0;

  return Math.max(...member.roles.map((r) => r.position));
}
