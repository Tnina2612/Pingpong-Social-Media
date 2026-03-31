/**
 * Helper to serialize args for python pickle/json compatibility.
 */
export function serializeRqData(funcName: string, args: any[]) {
  // In production, it's easier to have the Python worker expose a lightweight
  // FastAPI endpoint rather than reverse-engineering rq's serialization,
  // but this queue method is highly resilient for background tasks.
  return JSON.stringify({ func_name: funcName, args: args, kwargs: {} });
}
