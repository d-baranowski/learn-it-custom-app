import {NextApiRequest, NextApiResponse} from "next/types";
import {authBackend} from "~/server/connect/user";
import createSignedrpgToken from "~/auth/create-signed-rpg-token";

interface LoginRequest {
  email: string;
  password: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`login api called with bff url: '${process.env.BFF_URL}'`);
  if (req.method !== 'POST') {
    // Respond with an error for non-POST requests
    console.log("login api called with non-post method");
    res.status(405).json({message: 'Method not allowed'});
    return
  }

  try {
    // Extract data from the request body
    const {data} = req.body;
    const loginResponse = await authBackend.login(data)

    if (!loginResponse?.user?.id) {
      console.log("login failed, no user id in response");
      res.status(500).json({message: 'Login failed'});
      return;
    }

    console.log(`login successful for user id: '${loginResponse.user.id}'`);
    const token = await createSignedrpgToken(loginResponse)
    console.log("created signed rpg token");

    res
      .setHeader('Set-Cookie', `RPG_AUTH_TOKEN=${token}; Path=/; SameSite=Lax;`)
      .status(200)
      .json({message: 'Login success!'});
  } catch (error) {
    console.error("error caught while logging in", error);
    res.status(500).json({message: 'An error occurred while logging in', error: error });
  }
}
