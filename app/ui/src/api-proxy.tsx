import httpProxy from "http-proxy";
import {NextApiRequest, NextApiResponse} from "next/types";
import getToken from "~/auth/get-token";


const BFF_URL = process.env.BFF_URL || "http://localhost:9999"

const proxy = httpProxy.createProxyServer();

const apiProxy = (req: NextApiRequest, res: NextApiResponse) => {
  return new Promise<void>(async (resolve, reject) => {
    const token = await getToken({
      cookieString: req.headers.cookie,
    });

    if (!token) {
      res.status(401).send("Unauthorised");
      return reject(new Error("Unauthorised"));
    }

    req.url = req.url!.replace(/^\/api\/rpc/, '');
    req.url = req.url!.replace(/^\/api\//, '');

    const options = {
      target: BFF_URL,
      changeOrigin: true,

      headers: {
        // header values can't be undefined
        'x-user-id': token.userId,
        'x-session-id': token.sessionId || "",
        'X-User-ID': token.userId || "",
        'X-Session-ID': token.sessionId || "",
      }
    }

    try {
      console.log(`Proxying request to bffUrl:'${BFF_URL}' for req: '${req.url}'`);
      proxy.web(req, res, options, (err: Error) => {
        if (err) {
          console.log("error in the nextJs bff proxy: ", err);
          res.status(500).send("Internal Server Error");
          return reject(err);
        }
        resolve();
      });
    } catch (err) {
      console.log("error in the nextJs bff proxy: ", err);
      res.status(500).send("Internal Server Error");
      return reject(err);
    }
  });
};

export default apiProxy;
