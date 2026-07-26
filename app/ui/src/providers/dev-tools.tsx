import React, { createContext, useContext } from 'react';

/**
 * Whether the Dev Tools surface (database reset / re-bootstrap) is available.
 *
 * Why this is a context fed from the server rather than read from `config`
 * directly: `~/config` is built from `process.env`, and Next.js only inlines
 * `NEXT_PUBLIC_*` variables into the browser bundle. Reading
 * `config.ENABLE_DEV_TOOLS` from a client component therefore always yields the
 * default (`false`) no matter what the environment says — the flag could never
 * be turned ON.
 *
 * Renaming it to `NEXT_PUBLIC_ENABLE_DEV_TOOLS` would not fix it either: those
 * are baked in at BUILD time, and CI produces one `utro-ui` image that is
 * deployed to every environment. The value has to be resolved at request time.
 *
 * So `withTranslations()` reads the real env var inside `getServerSideProps` and
 * passes it down as a page prop, `_app` puts it here, and components read it
 * through `useDevToolsEnabled()`.
 *
 * This only controls VISIBILITY. The enforcement is server-side, in
 * `pages/dev-tools.tsx`, which 404s when the flag is off — a hidden link is not
 * a security control.
 */
const DevToolsEnabledContext = createContext<boolean>(false);

export const DevToolsProvider: React.FC<{
  enabled: boolean;
  children: React.ReactNode;
}> = ({ enabled, children }) => (
  <DevToolsEnabledContext.Provider value={enabled}>
    {children}
  </DevToolsEnabledContext.Provider>
);

export const useDevToolsEnabled = (): boolean => useContext(DevToolsEnabledContext);
