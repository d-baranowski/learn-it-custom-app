import {JWT} from "~/auth/types";
import {decodeJwt, jwtVerify} from "jose";
import cookie from "cookie";

interface Props {
  cookieString?: string | null;
}

const getToken = async (props: Props) => {
  let cookieString = props.cookieString;
  let cookiesObject: Record<string, string> = {};

  if (!cookieString) {
    return null;
  }

  try {
    cookiesObject = cookie.parse(cookieString)
  } catch (e) {
    console.error("error parsing cookie", e)
    return null;
  }

  const cookieValue = cookiesObject.RPG_AUTH_TOKEN;

  if (!cookieValue) {
    return null;
  }

  const secretString = process.env.JWT_SECRET
  // Verify only when secret is present in the environment so on the backend
  if (secretString?.length > 0) {
    const secretKey = new TextEncoder().encode(secretString);
    const {payload, protectedHeader} = await jwtVerify(cookieValue, secretKey, {
      issuer: process.env.JWT_ISSUER, // issuer
      audience: process.env.JWT_AUDIENCE, // audience
    });

    const token: JWT = payload as unknown as JWT;
    return Promise.resolve(token);
  } else {
    const decoded = decodeJwt(cookieValue)
    return Promise.resolve(decoded as unknown as JWT);
  }
}

export default getToken;
