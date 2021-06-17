namespace NodeJS {
    interface ProcessEnv extends NodeJS.ProcessEnv {
      NEXTAUTH_URL: string
      SECRET: string
      GOOGLE_ID: string
      GOOGLE_SECRET: string
    }
  }