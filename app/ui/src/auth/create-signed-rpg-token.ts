import {Session} from "~/auth/types";
import {SignJWT} from "jose";

async function createSignedRpgToken(session: Session) {
  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

  const token = await new SignJWT({
    userId: session.userId,
    sessionId: session.id,
    user: {
      id: session.user?.id || "",
      email: session.user?.email || "",
      name: session.user?.displayName || "",
      avatar: session.user?.avatar || "",
    }
  }) // details to  encode in the token
    .setProtectedHeader({
      alg: 'HS256'
    }) // algorithm
    .setIssuedAt()
    .setIssuer(process.env.JWT_ISSUER) // issuer
    .setAudience(process.env.JWT_AUDIENCE) // audience
    .setExpirationTime(Number(session.expires)) // token expiration time, e.g., "1 day"
    .sign(secretKey); // secretKey generated from previous step

  return token;
}

export default createSignedRpgToken;
