import { createPromiseClient, PromiseClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-node';
import { AuthService } from '@gen/core/auth/v1/auth_connect';
import { SessionService } from '@gen/core/session/v1/session_connect';

const bffBackendTransport = createConnectTransport({
  httpVersion: '1.1',
  baseUrl: process.env.BFF_URL ?? 'http://localhost:9999',
});

// const coreBackendTransport = createConnectTransport({
//   httpVersion: '1.1',
//   baseUrl: process.env.CORE_URL ?? 'http://localhost:9102',
// });

const globalForConnect = globalThis as unknown as {
  authBackend: PromiseClient<typeof AuthService> | undefined;
  sessionBackend: PromiseClient<typeof SessionService> | undefined;
};

export const authBackend =
  globalForConnect.authBackend ??
  createPromiseClient(AuthService, bffBackendTransport);

if (process.env.NODE_ENV !== 'production')
  globalForConnect.authBackend = authBackend;

export const sessionBackend =
  globalForConnect.sessionBackend ??
  createPromiseClient(SessionService, bffBackendTransport);

if (process.env.NODE_ENV !== 'production')
  globalForConnect.sessionBackend = sessionBackend;
