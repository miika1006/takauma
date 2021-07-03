import { Session, User, DefaultUser } from "next-auth";
//import { DefaultJWT } from "next-auth/jwt";

/** Example on how to extend the built-in session types */
declare module "next-auth" {
	interface Session {
		//extends Record<string, unknown>, DefaultSession {
		accessToken: string;
		error: string;
	}
	/*interface JWT extends Record<string, unknown>, DefaultJWT {
		accessToken: string;
		error: string;
	}*/
	interface User {
		accessToken: string;
		error: string;
	}
	interface Profile {
		verified_email: boolean;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		accessToken: string;
		refreshToken: string;
		error: string;
		accessTokenExpires: number;
	}
}
