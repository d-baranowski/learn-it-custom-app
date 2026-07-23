import {createPromiseClient, PromiseClient} from "@connectrpc/connect";
import {SessionValidationService} from "@gen/core/v1/session_validation_connect";
import {ConnectTransport} from "~/utils/connect";

const globalForConnect = globalThis as unknown as {
  sessionValidationBackend: PromiseClient<typeof SessionValidationService> | undefined;
};

export const sessionValidationBackend=
  globalForConnect.sessionValidationBackend ??
  createPromiseClient(SessionValidationService, ConnectTransport);

if (process.env.NODE_ENV !== "production") globalForConnect.sessionValidationBackend = sessionValidationBackend;
