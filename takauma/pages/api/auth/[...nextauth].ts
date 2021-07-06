import { JWT } from "next-auth/jwt";
import NextAuth, { Session, User } from "next-auth";
import Providers from "next-auth/providers";
import AWS from "aws-sdk";
import { DynamoDBAdapter } from "@next-auth/dynamodb-adapter";
import { dynamo } from "../../../lib/dynamo-db";

AWS.config.update({
	accessKeyId: process.env.APP_AWS_ACCESS_KEY,
	secretAccessKey: process.env.APP_AWS_SECRET_KEY,
	region: process.env.APP_AWS_REGION,
});

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth({
	// https://next-auth.js.org/configuration/providers
	providers: [
		//https://next-auth.js.org/providers/google
		Providers.Google({
			clientId: process.env.GOOGLE_ID,
			clientSecret: process.env.GOOGLE_SECRET,
			//access users email address
			//and View and manage Google Drive files and folders that you have opened or created with this app
			scope:
				"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file",
			...(process.env.NODE_ENV === "development"
				? {
						authorizationUrl:
							"https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code",
				  }
				: {}),
		}),
	],
	// Database optional. MySQL, Maria DB, Postgres and MongoDB are supported.
	// https://next-auth.js.org/configuration/databases
	//
	// Notes:
	// * You must install an appropriate node_module for your database
	// * The Email provider requires a database (OAuth providers do not)
	//database: process.env.DATABASE_URL,
	adapter: DynamoDBAdapter(new AWS.DynamoDB.DocumentClient(), {
		tableName: process.env.APP_AWS_NEXT_AUTH_TABLE_NAME,
	}),
	// The secret should be set to a reasonably long random string.
	// It is used to sign cookies and to sign and encrypt JSON Web Tokens, unless
	// a separate secret is defined explicitly for encrypting the JWT.
	secret: process.env.SECRET,
	session: {
		// Use JSON Web Tokens for session instead of database sessions.
		// This option can be used with or without a database for users/accounts.
		// Note: `jwt` is automatically set to `true` if no database is specified.
		jwt: true,

		// Seconds - How long until an idle session expires and is no longer valid.
		maxAge: 30 * 24 * 60 * 60, // 30 days

		// Seconds - Throttle how frequently to write to database to extend a session.
		// Use it to limit write operations. Set to 0 to always update the database.
		// Note: This option is ignored if using JSON Web Tokens
		updateAge: 24 * 60 * 60, // 24 hours
	},

	// JSON Web tokens are only used for sessions if the `jwt: true` session
	// option is set - or by default if no database is specified.
	// https://next-auth.js.org/configuration/options#jwt
	jwt: {
		// A secret to use for key generation (you should set this explicitly)
		secret: process.env.SECRET,
		// Set to true to use encryption (default: false)
		encryption: true,
		// You can define your own encode/decode functions for signing and encryption
		// if you want to override the default behaviour.
		// encode: async ({ secret, token, maxAge }) => {},
		// decode: async ({ secret, token, maxAge }) => {},
	},

	// You can define custom pages to override the built-in ones. These will be regular Next.js pages
	// so ensure that they are placed outside of the '/api' folder, e.g. signIn: '/auth/mycustom-signin'
	// The routes shown here are the default URLs that will be used when a custom
	// pages is not specified for that route.
	// https://next-auth.js.org/configuration/pages
	pages: {
		// signIn: '/auth/signin',  // Displays signin buttons
		// signOut: '/auth/signout', // Displays form with sign out button
		// error: '/auth/error', // Error code passed in query string as ?error=
		// verifyRequest: '/auth/verify-request', // Used for check email page
		// newUser: null // If set, new users will be directed here on first sign in
	},

	// Callbacks are asynchronous functions you can use to control what happens
	// when an action is performed.
	// https://next-auth.js.org/configuration/callbacks
	callbacks: {
		async signIn(user, account, profile) {
			console.log(
				"signIn: user: ",
				user.email,
				"verified_email: ",
				profile.verified_email
			);

			return (await dynamo.isBanned(user.email)) === false;
		},

		async jwt(token, user, account, profile, isNewUser) {
			console.log("jwt check", token.email, token);
			console.log("jwt", token);
			// Initial sign in
			if (account && user) {
				return {
					...token,
					accessToken: account.accessToken,
					//accessTokenExpires: Date.now() + (account.expires_in ?? 0) * 1000,
					accessTokenExpires: 0, //TEST
					refreshToken: account.refresh_token ?? "",
				};
			}

			if (await dynamo.isBanned(token.email)) {
				console.log(
					"jwt check",
					"user is banned, expires now and skipping refresh"
				);
				return {
					...token,
					accessTokenExpires: Date.now(),
				};
			}

			// Return previous token if the access token has not expired yet
			if (Date.now() < token.accessTokenExpires) {
				return token;
			}

			// Access token has expired, try to update it
			return await refreshAccessToken(token);
		},
		async session(session, userOrToken) {
			console.log("session check", userOrToken.email);
			console.log(userOrToken, session);
			if (userOrToken) {
				session.user = userOrToken.user
					? (userOrToken.user as User)
					: (userOrToken as JWT);
				session.accessToken = userOrToken.accessToken;
			}

			return session;
		},

		// async signIn(user, account, profile) { return true },
		// async redirect(url, baseUrl) { return baseUrl },
		// async session(session, user) { return session },
		// async jwt(token, user, account, profile, isNewUser) { return token }
	},

	// Events are useful for logging
	// https://next-auth.js.org/configuration/events
	events: {
		async signIn({ user, account, isNewUser }) {
			console.log("User signed in", user.email, "IsNewUser", isNewUser);

			if (user.email && isNewUser) {
				dynamo.saveUser({
					UserEmail: user.email,
					IsBanned: false,
				});
			}
		},
	},

	// Enable debug messages in the console if you are having problems
	debug: false,
	//debug: process.env.NODE_ENV === "development",
});

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 * Method from
 *  https://next-auth.js.org/tutorials/refresh-token-rotation
 *  Source: https://github.com/lawrencecchen/next-auth-refresh-tokens/blob/main/pages/api/auth/%5B...nextauth%5D.js
 *
 */

async function refreshAccessToken(token: JWT): Promise<JWT> {
	try {
		console.log("jwt check", "refreshing access token for", token.email);

		const searchParams = new URLSearchParams();
		searchParams.append("client_id", process.env.GOOGLE_ID ?? "");
		searchParams.append("client_secret", process.env.GOOGLE_SECRET ?? "");
		searchParams.append("grant_type", "refresh_token");
		searchParams.append("refresh_token", token.refreshToken);

		const url =
			"https://oauth2.googleapis.com/token?" + searchParams.toString();

		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "POST",
		});

		const refreshedTokens = await response.json();
		console.log(
			"jwt check",
			"refreshedTokens new accesstoken",
			refreshedTokens.access_token
		);
		if (!response.ok) {
			throw refreshedTokens;
		}

		return {
			...token,
			accessToken: refreshedTokens.access_token,
			accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
		};
	} catch (error) {
		console.error("jwt check", "refreshAccessToken error", error);

		return {
			...token,
		};
	}
}
