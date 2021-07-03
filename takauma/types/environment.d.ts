namespace NodeJS {
	interface ProcessEnv extends NodeJS.ProcessEnv {
		NEXTAUTH_URL: string;
		SECRET: string;
		GOOGLE_ID: string;
		GOOGLE_SECRET: string;
		SERVICE_ACCOUNT: string;
		SERVICE_ACCOUNT_KEY: string;
		APP_AWS_ACCESS_KEY: string;
		APP_AWS_SECRET_KEY: string;
		APP_AWS_REGION: string;
		APP_AWS_TABLE_NAME: string;
		APP_AWS_NEXT_AUTH_TABLE_NAME: string;
	}
}
