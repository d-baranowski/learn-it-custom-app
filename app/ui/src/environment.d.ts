namespace NodeJS {
  interface ProcessEnv {
    BFF_URL: string;
    ENABLE_DEV_TOOLS: string;
    ENABLE_TRANSLATION: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    NODE_ENV: 'development' | 'production';
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    VERSION: string;
    JWT_SECRET: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
    CF_JWT_AUDIENCE: string;
    CF_JWT_ISSUER: string;
    CF_TEAM_DOMAIN: string;
  }
}
