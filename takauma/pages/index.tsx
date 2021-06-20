import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { Session } from "next-auth";
import { getSession } from "next-auth/client";
import { PageProps } from "../common/types";
import styles from "../styles/home.module.css";
import { Parallax, ParallaxProvider } from "react-scroll-parallax";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");
	const applicationDescription = t("appdescription");

	return (
		<ParallaxProvider>
			<Layout t={t} locale={locale}>
				<Parallax y={[-40, 40]} className={styles.coverimage} tagOuter="div">
					<Image
						src="/images/metsa2.jpeg"
						width={2048}
						height={1367}
						alt="Metsä kansikuva"
					/>
				</Parallax>

				<div className={styles.cover}>
					<h1 className={styles.apptitle}>
						<div className={styles.applogo}>
							<Image src="/logo.svg" alt="Logo" width={100} height={100} />
						</div>
						<Parallax y={[-70, 70]} tagOuter="div">
							{t("apptitle")}
						</Parallax>
					</h1>
					<Parallax y={[0, 60]} tagOuter="div">
						<p className={styles.appdesc}>
							{applicationDescription
								.split(".")
								.map((text) => (text != "" ? <div> {text}. </div> : null))}
						</p>
					</Parallax>
				</div>
				<div className={styles.frontcontent}>
					<article>
						<h1>Mistä on kyse?</h1>
						<p></p>
					</article>

					<article>
						<h1>Näin pääset alkuun</h1>
						<ol>
							<ul></ul>
						</ol>
					</article>
				</div>
			</Layout>
		</ParallaxProvider>
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
