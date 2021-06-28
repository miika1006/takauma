namespace NodeJS {
	interface ProcessEnv extends NodeJS.ProcessEnv {
		NEXTAUTH_URL: string;
		SECRET: string;
		GOOGLE_ID: string;
		GOOGLE_SECRET: string;
		SERVICE_ACCOUNT: string;
		SERVICE_ACCOUNT_KEY: string;
	}
}
