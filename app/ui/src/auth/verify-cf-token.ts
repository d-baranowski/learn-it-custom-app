import {importJWK, jwtVerify} from "jose";

interface CFToken {
  aud: string[]
  email: string
  exp: number
  iat: number
  nbf: number
  iss: string,
  type: string,
  identity_nonce: string
  sub: string
  country: string
}

async function verifyCfToken(cfToken: string): Promise<CFToken | null> {
  try {
    console.log("Verifying CF token");
    const teamDomain = process.env.CF_TEAM_DOMAIN;
    const cfCertsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;
    const cfCertsData = await fetch(cfCertsUrl).then(res => res.json());

    for (let i = 0; i < cfCertsData.keys.length; i++) {
      const key = cfCertsData.keys[i]
      const alg = key.alg;
      try {
        const publicKey = await importJWK(key, alg)
        const {payload, protectedHeader} = await jwtVerify(cfToken, publicKey, {
          issuer: process.env.CF_JWT_ISSUER, // issuer
          audience: process.env.CF_JWT_AUDIENCE, // audience
        });

        console.log("Successfully verified CF token for", payload.sub);

        return payload as unknown as CFToken;
      } catch (e) {
        console.log("Failed to verify with key", key.kid, e);
      }
    }

    return null;
  } catch (e) {
    console.error("error caught while verifying CF token", e);
    return null;
  }
}

export default verifyCfToken;
