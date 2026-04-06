import type { JWT } from "next-auth/jwt";
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { dynamo } from "../../../lib/dynamo-db";

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_ID ?? "",
			clientSecret: process.env.GOOGLE_SECRET ?? "",
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
					scope:
						"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file",
				},
			},
		}),
	],

	secret: process.env.SECRET,

	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},

	callbacks: {
		async signIn({ user, profile }) {
			console.log(
				"signIn: user:",
				user.email,
				"verified_email:",
				(profile as { verified_email?: boolean })?.verified_email
			);
			return (await dynamo.isBanned(user.email)) === false;
		},

		async jwt({ token, user, account }) {
			console.log("jwt check", token.email);
			// Initial sign in
			if (account && user) {
				return {
					...token,
					accessToken: account.access_token,
					accessTokenExpires:
						Date.now() + (account.expires_at ?? 0) * 1000,
					refreshToken:
						account.refresh_token ?? token.refreshToken ?? "",
				};
			}

			// Return previous token if the access token has not expired yet
			if (Date.now() < (token.accessTokenExpires as number)) {
				return token;
			}

			// If token expired, check if banned
			if (await dynamo.isBanned(token.email as string)) {
				console.log(
					"jwt check",
					"user is banned, expires now and skipping refresh"
				);
				return {
					...token,
					accessTokenExpires: Date.now(),
					error: "Expired",
				};
			}

			// Access token has expired, try to update it
			const newJwt = await refreshAccessToken(token);

			const email = (token.email ?? newJwt.email ?? "") as string;
			if (email) {
				console.log("Saving new tokens for user to dynamoDB");
				dynamo.saveUser({
					UserEmail: email,
					IsBanned: false,
					accessToken: (newJwt.accessToken as string) ?? "",
					refreshToken: (newJwt.refreshToken as string) ?? "",
				});
			}

			return newJwt;
		},

		async session({ session, token }) {
			console.log("session check", token.email);
			session.accessToken = (token.accessToken as string) ?? "";
			session.refreshToken = (token.refreshToken as string) ?? "";
			session.error = (token.error as string) ?? "";
			return session;
		},
	},

	events: {
		async signIn({ user, account }) {
			console.log("User signed in", user.email);
			if (user.email && account) {
				dynamo.saveUser({
					UserEmail: user.email,
					IsBanned: false,
					accessToken: account.access_token ?? "",
					refreshToken: account.refresh_token ?? "",
				});
			}
		},
	},

	debug: false,
};

export default NextAuth(authOptions);

/**
 * Takes a token and returns a new token with updated access/refresh tokens.
 * If an error occurs, returns the old token with an error property.
 * https://next-auth.js.org/tutorials/refresh-token-rotation
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
	try {
		console.log("jwt check", "refreshing access token for", token.email);

		const params = new URLSearchParams({
			client_id: process.env.GOOGLE_ID ?? "",
			client_secret: process.env.GOOGLE_SECRET ?? "",
			grant_type: "refresh_token",
			refresh_token: (token.refreshToken as string) ?? "",
		});

		const response = await fetch(
			"https://oauth2.googleapis.com/token?" + params.toString(),
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			}
		);

		const refreshedTokens = await response.json();

		if (!response.ok) {
			throw refreshedTokens;
		}

		return {
			...token,
			accessToken: refreshedTokens.access_token,
			accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
		};
	} catch (error) {
		console.error("jwt check", "refreshAccessToken error", error);
		return { ...token, error: "RefreshAccessTokenError" };
	}
}
