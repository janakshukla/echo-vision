type LogPayload = unknown;

const warnThrottleState = new Map<string, number>();

const toErrorLike = (payload: LogPayload) => {
  if (payload instanceof Error) return payload;
  if (typeof payload === "string") return new Error(payload);

  try {
    return new Error(JSON.stringify(payload));
  } catch {
    return new Error(String(payload));
  }
};

export const logDebug = (message: string, payload?: LogPayload) => {
  if (!import.meta.env.DEV) return;
  if (payload === undefined) {
    console.debug(`[debug] ${message}`);
    return;
  }
  console.debug(`[debug] ${message}`, payload);
};

export const logWarn = (message: string, payload?: LogPayload) => {
  if (payload === undefined) {
    console.warn(`[warn] ${message}`);
    return;
  }
  console.warn(`[warn] ${message}`, toErrorLike(payload));
};

export const logWarnThrottled = (
  key: string,
  message: string,
  payload?: LogPayload,
  throttleMs = 2000,
) => {
  const now = Date.now();
  const last = warnThrottleState.get(key) ?? 0;
  if (now - last < throttleMs) return;

  warnThrottleState.set(key, now);
  logWarn(message, payload);
};

export const logError = (message: string, payload?: LogPayload) => {
  if (payload === undefined) {
    console.error(`[error] ${message}`);
    return;
  }
  console.error(`[error] ${message}`, toErrorLike(payload));
};
