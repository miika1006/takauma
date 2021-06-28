import React, { useState, useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import Layout from "../../components/layout";
import AccessDenied from "../../components/access-denied";
import { Session } from "next-auth";
import { GetServerSideProps, GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageProps } from "../../common/types";
import GoogleDriveUpload from "../../components/googledriveupload";
import { GetGoogleDriveFolders } from "../../lib/googledrive";
import { drive_v3 } from "googleapis";

export interface EventPageProps {
	folders: drive_v3.Schema$File[];
}
export default function Page({ locale, folders }: PageProps & EventPageProps) {
	const { t } = useTranslation("common");
	const [session, loading] = useSession();

	// When rendering client side don't display anything until loading is complete
	if (typeof window !== "undefined" && loading) return null;

	// If no session exists, display access denied message
	if (!session) {
		return (
			<Layout t={t} locale={locale}>
				<AccessDenied t={t} />
			</Layout>
		);
	}
	// If session exists, display content
	return (
		<Layout t={t} locale={locale}>
			<h1>{t("eventstitle")}</h1>
			<GoogleDriveUpload t={t} folders={folders} />
		</Layout>
	);
}

// Export the `session` prop to use sessions with Server Side Rendering
// We need to use this for sessions, so using it for locales also
export const getServerSideProps: GetServerSideProps<{
	session: Session | null;
}> = async (context) => {
	const session = await getSession(context);

	return {
		props: {
			session: session,
			...(await serverSideTranslations(context.locale as string, ["common"])),
			locale: context.locale as string,

			folders: session
				? await GetGoogleDriveFolders(
						session?.accessToken as string,
						session?.refreshToken as string
				  )
				: [],
		},
	};
};
