import React from "react";
import Layout from "../../components/layout";
import { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageProps } from "../../common/types";
import { GetGoogleDriveFolderByIdUsingServiceAccount } from "../../lib/googledrive";
import { drive_v3 } from "googleapis";
import { useRouter } from "next/router";
import EventNotFound from "../../components/eventnotfound";
import GoogleDriveUpload from "../../components/googledrive-upload";

export interface EventPageProps {
	folder: drive_v3.Schema$File;
}
export default function Page({ locale, folder }: PageProps & EventPageProps) {
	const { t } = useTranslation("common");
	return (
		<Layout t={t} locale={locale} padded centered>
			{folder && folder.shared ? (
				<>
					<h1>{folder.name}</h1>
					<GoogleDriveUpload t={t} folder={folder} />
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
	const { folderid } = context.query;

	console.log("folderid", folderid);
	return {
		props: {
			...(await serverSideTranslations(context.locale as string, ["common"])),
			locale: context.locale as string,
			folder:
				folderid && folderid !== "undefined"
					? await GetGoogleDriveFolderByIdUsingServiceAccount(
							folderid as string
					  )
					: null,
		},
	};
};
