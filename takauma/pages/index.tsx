import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetStaticProps } from "next";

export default function Page() {
	const { t } = useTranslation("common");

	return (
		<Layout t={t}>
			<h1>{t("apptitle")}</h1>
			<Image src="/logo.svg" alt="Logo" width={100} height={100} />
			<p>{t("appdescription")}</p>
		</Layout>
	);
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"])),
	},
});
