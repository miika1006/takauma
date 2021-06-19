import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/client";
import { PageProps } from "../common/types";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");

	return (
		<Layout t={t} locale={locale}>
			<h1>{t("apptitle")}</h1>
			<Image src="/logo.svg" alt="Logo" width={100} height={100} />
			<p>{t("appdescription")}</p>
		</Layout>
	);
}

// Export the `session` prop to use sessions with Server Side Rendering
export const getServerSideProps: GetServerSideProps<{
	session: Session | null;
}> = async (context) => {
	return {
		props: {
			session: await getSession(context),
			locale: context.locale as string,
			...(await serverSideTranslations(context.locale as string, ["common"])),
		},
	};
};
/*
export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"])),
	},
});*/
