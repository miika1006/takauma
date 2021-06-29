import { Session } from "next-auth";

export type PageProps = {
	locale: string;
	session: Session | null;
	shouldSingOut: boolean;
};
