import { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import Layout from "../components/layout";
import AccessDenied from "../components/access-denied";
import { Session } from "next-auth";
import { GetServerSideProps, GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageProps } from "../common/types";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");
	// As this page uses Server Side Rendering, the `session` will be already
	// populated on render without needing to go through a loading stage.
	// This is possible because of the shared context configured in `_app.js` that
	// is used by `useSession()`.
	const [session, loading] = useSession();
	const [content, setContent] = useState();

	// Fetch content from protected route
	useEffect(() => {
		const fetchData = async () => {
			const res = await fetch("/api/protected");
			const json = await res.json();
			if (json.content) {
				setContent(json.content);
			}
		};
		fetchData();
	}, [session]);

	// When rendering client side don't display anything until loading is complete
	if (typeof window !== "undefined" && loading) return null;

	// If no session exists, display access denied message
	if (!session) {
		return (
			<Layout t={t} locale={locale}>
				<AccessDenied />
			</Layout>
		);
	}

	// If session exists, display content
	return (
		<Layout t={t} locale={locale}>
			<h1>{t("apptitle")}</h1>
			<p>{t("appdescription")}</p>
			<h1>Protected Page</h1>
			<p>
				<strong>{content || "\u00a0"}</strong>
			</p>
		</Layout>
	);
}

// Export the `session` prop to use sessions with Server Side Rendering
// We need to use this for sessions, so using it for locales also
export const getServerSideProps: GetServerSideProps<{
	session: Session | null;
}> = async (context) => {
	return {
		props: {
			session: await getSession(context),
			...(await serverSideTranslations(context.locale as string, ["common"])),
			locale: context.locale as string,
		},
	};
};
// We cannot use this, because serverside and static cannot coexist
/*export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"])),
	},
});*/
