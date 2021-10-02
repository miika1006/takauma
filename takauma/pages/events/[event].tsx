import React from "react";
import Layout from "../../components/layout";
import { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageProps } from "../../common/types";
import { GetGoogleDriveFolderById } from "../../lib/googledrive";
import { drive_v3 } from "googleapis";
import { useRouter } from "next/router";
import EventNotFound from "../../components/eventnotfound";
import GoogleDriveUpload from "../../components/googledrive-upload";
import { dynamo } from "../../lib/dynamo-db";
import { FromBase64ToEmailAndFolder } from "../../lib/event";

export interface EventPageProps {
	folder: drive_v3.Schema$File;
	email: string;
}
export default function Page({
	locale,
	email,
	folder,
}: PageProps & EventPageProps) {
	const { t } = useTranslation("common");
	return (
		<Layout t={t} locale={locale} padded centered>
			{folder && folder.shared ? (
				<>
					<h1>{folder.name}</h1>
					<GoogleDriveUpload t={t} folder={folder} email={email} />
				</>
			) : (
				<EventNotFound t={t} />
			)}
		</Layout>
	);
}
//Get folder from Google drive as prop
export const getServerSideProps: GetServerSideProps<{
	folder: drive_v3.Schema$File | null | null;
}> = async (context) => {
	const { event } = context.query;
	const { folderid, email } = FromBase64ToEmailAndFolder(event as string);

	console.log("folderid", folderid, "email", email);

	const user = await dynamo.getUser(email as string);

	return {
		props: {
			...(await serverSideTranslations(context.locale as string, ["common"])),
			locale: context.locale as string,
			email: email,
			folder:
				folderid &&
				folderid !== "undefined" &&
				user !== null &&
				user.IsBanned === false
					? await GetGoogleDriveFolderById(
							user.accessToken,
							user.refreshToken,
							folderid as string
					  )
					: null,
		},
	};
};
