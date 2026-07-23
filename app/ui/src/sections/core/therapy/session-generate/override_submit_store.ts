type OverrideHandler = (values: Record<string, unknown>) => Promise<unknown>;

const handlers = new Map<string, OverrideHandler>();

export function setOverrideSubmitHandler(windowId: string, handler: OverrideHandler) {
  handlers.set(windowId, handler);
}

export function consumeOverrideSubmitHandler(windowId: string): OverrideHandler | undefined {
  const handler = handlers.get(windowId);
  handlers.delete(windowId);
  return handler;
}
