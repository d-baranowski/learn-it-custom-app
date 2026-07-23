export type RpgWindowEventType = 'rpg:window:closed' | 'rpg:window:saved';

export type RpgWindowEventDetail = {
  windowId: string;
  formName: string;
  title: string;
  /** Stable per-form id (from formProps.formId), used to scope afterSave. */
  formId?: string;
  /** Optional payload from afterSave callback */
  data?: unknown;
};

export type RpgWindowEvent = CustomEvent<RpgWindowEventDetail>;

function isBrowserDocumentAvailable(): boolean {
  return typeof document !== 'undefined' && !!document;
}

export function dispatchRpgWindowEvent(
  type: RpgWindowEventType,
  detail: RpgWindowEventDetail,
) {
  if (!isBrowserDocumentAvailable()) return;

  const event: RpgWindowEvent = new CustomEvent(type, {detail});
  document.dispatchEvent(event);
}

export function subscribeRpgWindowEvent(
  type: RpgWindowEventType,
  handler: (event: RpgWindowEvent) => void,
) {
  if (!isBrowserDocumentAvailable()) {
    return () => {};
  }

  const wrapped = (e: Event) => handler(e as RpgWindowEvent);
  document.addEventListener(type, wrapped as EventListener);

  return () => {
    document.removeEventListener(type, wrapped as EventListener);
  };
}

