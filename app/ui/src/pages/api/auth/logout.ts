import {NextApiRequest, NextApiResponse} from "next/types";
import {authBackend} from "~/server/connect/user";
import getToken from "~/auth/get-token";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    // Respond with an error for non-POST requests
    res.status(405).json({message: 'Method not allowed'});
    return
  }

  try {
    const token = await getToken({
      cookieString: req.headers.cookie,
    })

    // Extract data from the request body
    const {data} = req.body;
    const logoutUrl = `${process.env.CF_JWT_ISSUER}/cdn-cgi/access/logout`
    const cfToken: string | undefined = req.headers["cf-access-jwt-assertion"] as string;

    const logoutResponse = await authBackend.logout(data, {
      headers: {
        // header values can't be undefined
        'x-user-id': token?.userId || "",
        'x-session-id': token?.sessionId || "",
        'X-User-ID': token?.userId || "",
        'X-Session-ID': token?.sessionId || "",
      }
    })

    if (cfToken) {
      res
        .setHeader('Set-Cookie', `RPG_AUTH_TOKEN=; Path=/; SameSite=Strict; Secure;`)
        .redirect(logoutUrl);
      return;
    }

    res
      .setHeader('Set-Cookie', `RPG_AUTH_TOKEN=; Path=/; SameSite=Strict; Secure;`)
      .status(200)
      .json({message: 'Logout success!'});
  } catch (error) {
    console.error("error caught while logging out", error);
    res.status(500).json({message: 'An error occurred while logging out', error: error});
  }
}
