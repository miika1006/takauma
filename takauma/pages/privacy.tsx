import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { PageProps } from "../common/types";
import Privacy from "../components/privacy";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");

	return (
		<Layout t={t} locale={locale} padded>
			<Privacy t={t} />
		</Layout>
	);
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"])),
		locale: locale as string,
	},
});
