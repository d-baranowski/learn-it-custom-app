import {Session} from "~/auth/types";
import {NextPageContext} from "next/dist/shared/lib/utils";
import getToken from "~/auth/get-token";
import {sessionBackend} from "~/server/connect/user";

async function getSession(ctx?: NextPageContext): Promise<Session | null> {
  if (!ctx?.req) {
    return null
  }

  const token = await getToken({
    cookieString: ctx?.req.headers.cookie,
  })

  try {
    const response = await sessionBackend.getUserSession({id: token?.sessionId}, {
      headers: {
        // header values can't be undefined
        'x-user-id': token?.userId || "",
        'x-session-id': token?.sessionId || "",
        'X-User-ID': token?.userId || "",
        'X-Session-ID': token?.sessionId || "",
      }
    })

    return response;
  } catch
    (e) {
    console.error("error getting session", e)
  }

  return null
}

export default getSession;
