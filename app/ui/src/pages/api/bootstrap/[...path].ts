import httpProxy from 'http-proxy';
import type { NextApiRequest, NextApiResponse } from 'next/types';

const BOOTSTRAP_URL =
  process.env.BOOTSTRAP_API_URL || 'http://localhost:8080';

const proxy = httpProxy.createProxyServer();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    req.url = req.url!.replace(/^\/api\/bootstrap/, '');

    try {
      proxy.web(
        req,
        res,
        {
          target: BOOTSTRAP_URL,
          changeOrigin: true,
          headers: {
            'x-user-id': 'bootstrap-service',
            'x-session-id': 'bootstrap-service',
          },
        },
        (err: Error) => {
          if (err) {
            console.log('error in bootstrap proxy: ', err);
            res.status(500).send('Internal Server Error');
            return reject(err);
          }
          resolve();
        },
      );
    } catch (err) {
      console.log('error in bootstrap proxy: ', err);
      res.status(500).send('Internal Server Error');
      return reject(err);
    }
  });
}
