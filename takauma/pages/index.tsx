import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { PageProps } from "../common/types";
import styles from "../styles/index.module.css";
import { Parallax, ParallaxProvider } from "react-scroll-parallax";
import { signIn } from "next-auth/client";

export default function Page({ locale }: PageProps) {
	const { t } = useTranslation("common");
	const applicationDescription = t("appdescription");

	return (
		<ParallaxProvider>
			<Layout t={t} locale={locale}>
				<Parallax translateY={[-40, 40]} className={styles.coverimage}>
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
						<Parallax translateY={[-70, 70]}>{t("apptitle")}</Parallax>
					</h1>
					<Parallax translateY={[0, 60]}>
						<p className={styles.appdesc}>
							{applicationDescription.split(".").map((text, index) =>
								text != "" ? (
									<span key={`appdesc-${index}`}>
										{text}. <br />
									</span>
								) : null
							)}
						</p>
					</Parallax>
				</div>
				<div className={styles.frontcontent}>
					<article>
						<h1>{t("what_is_this")}</h1>
						<p>{t("what_is_this_desc_0")}</p>
						<p>{t("what_is_this_desc_1")}</p>
						<p></p>
						<p>{t("what_is_this_desc_2")}</p>
					</article>

					<article>
						<h1>{t("getting started")}</h1>
						<ol>
							<li>
								<a
									href={`/api/auth/signin`}
									onClick={(e) => {
										e.preventDefault();
										signIn("google", {
											callbackUrl: window.location.origin + "/events",
										}); //Google, because it is only provider
									}}
								>
									{t("googlesignin")}
								</a>
							</li>
							<li>{t("getting_started_allow_app_to")}</li>
							<li>{t("create_new_event")}</li>
							<li>{t("share_link")}</li>
							<li>{t("upload_photos")}</li>
						</ol>
						<p>{t("everyone_with_the_link_can")}</p>
						<p>{t("how_to_delete")}</p>
					</article>
				</div>
			</Layout>
		</ParallaxProvider>
	);
}

// Export the `session` prop to use sessions with Server Side Rendering
export const getServerSideProps: GetServerSideProps = async (context) => {
	return {
		props: {
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
