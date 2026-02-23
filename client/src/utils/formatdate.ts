export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  let diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins > 1 ? "minutes" : "minute"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours > 1 ? "hours" : "hour"} ago`;
  }
  return `${diffDays} ${diffDays > 1 ? "days" : "day"} ago`;
};
