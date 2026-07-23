import React, {createContext, useContext} from 'react';
import {JWT, Session} from "~/auth/types";
import {useQuery} from "@connectrpc/connect-query";
import {getUserSession} from "@gen/core/session/v1/session-SessionService_connectquery";
import {useRouter} from "next/router";
import {Code, ConnectError} from "@connectrpc/connect";

interface Props extends React.PropsWithChildren {
  refetchInterval: number
  token: JWT | null | undefined;
}

export interface SessionContextType {
  session: Session | undefined
  logOut: () => Promise<void>
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SessionProvider: React.FunctionComponent<Props> = function SessionProvider(props) {
  const {data: session, refetch, error} = useQuery(getUserSession, {id: props.token?.sessionId}, {
    enabled: false,
  })
  const router = useRouter();

  React.useEffect(() => {
    if (props.token?.sessionId) {
      try {
        refetch().catch((err) => {
          console.log(err)
        })
      } catch (e) {
        console.log("error caught in refetch",e)
      }
    }
  }, [props.token?.sessionId, refetch])

  React.useEffect(() => {
    if (!error) return;
    if (router.pathname === '/auth/signout') return;
    const connectErr = ConnectError.from(error)
    if (connectErr.code === Code.Unauthenticated) {
      router.push("/auth/signout")
    }
  }, [error, router])

  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch().catch((err) => {
        console.log(err)
      })
    }, props.refetchInterval * 1000);

    return () => clearInterval(interval);
  }, [props.refetchInterval, refetch]);

  return (
    <SessionContext.Provider
      value={
        {
          session: session,
          logOut: async () => {
            await router.push("/auth/signout")
          }
        }
      }
    >
      {props.children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within an useSessionProvider');
  }
  return context;
};

export default SessionProvider;
