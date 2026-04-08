import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import nextI18NextConfig from "../next-i18next.config";
import { PageProps } from "../common/types";
import Privacy from "../components/privacy";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");

	return (
		<Layout t={t} locale={locale} padded centered>
			<Privacy t={t} />
		</Layout>
	);
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"], nextI18NextConfig)),
		locale: locale as string,
	},
});
