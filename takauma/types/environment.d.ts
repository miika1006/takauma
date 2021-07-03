namespace NodeJS {
	interface ProcessEnv extends NodeJS.ProcessEnv {
		NEXTAUTH_URL: string;
		SECRET: string;
		GOOGLE_ID: string;
		GOOGLE_SECRET: string;
		SERVICE_ACCOUNT: string;
		SERVICE_ACCOUNT_KEY: string;
		AWS_ACCESS_KEY: string;
		AWS_SECRET_KEY: string;
		AWS_REGION: string;
		AWS_TABLE_NAME: string;
		AWS_NEXT_AUTH_TABLE_NAME: string;
	}
}
