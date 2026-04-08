import Layout from "../components/layout";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import nextI18NextConfig from "../next-i18next.config";
import { useTranslation } from "next-i18next/pages";
import { PageProps } from "../common/types";
import Terms from "../components/terms";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");
	return (
		<Layout
			t={t}
			locale={locale}
			padded
			centered
			title={t("termsofservice")}
			description={t("meta_terms_description")}
		>
			<Terms t={t} />
		</Layout>
	);
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"], nextI18NextConfig)),
		locale: locale as string,
	},
});
