import Layout from "../components/layout";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { PageProps } from "../common/types";
import Terms from "../components/terms";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");
	return (
		<Layout t={t} locale={locale} padded centered>
			<Terms t={t} />
		</Layout>
	);
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale as string, ["common"])),
		locale: locale as string,
	},
});
