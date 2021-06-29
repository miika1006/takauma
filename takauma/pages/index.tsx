import Layout from "../components/layout";
import Image from "next/image";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { Session } from "next-auth";
import { getSession, signIn, signout } from "next-auth/client";
import { PageProps } from "../common/types";
import styles from "../styles/Home.module.css";
import { Parallax, ParallaxProvider } from "react-scroll-parallax";
import { IsUserBanned } from "../lib/user";
import { useEffect } from "react";

export default function Page({ locale, shouldSingOut }: PageProps) {
	const { t } = useTranslation("common");
	const applicationDescription = t("appdescription");

	useEffect(() => {
		if (shouldSingOut) {
			console.log("Signing out");
			signout();
		}
	});
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
						<h1>Mistä on kyse?</h1>
						<p>
							Web-sovellus, jolla voi luoda tapahtumia, jakaa tapahtumaan linkin
							ja kaikki linkin saaneet voivat ladata ja selata kuvia
							tapahtumaan.
						</p>
						<p>
							Kuvat tallentuvat sinun Google Driveen kansioon tapahtuman
							nimellä.
						</p>
						<p>Taltioi ja jaa hetket yhdessä monesta eri kamerasta.</p>
					</article>

					<article>
						<h1>Näin pääset alkuun</h1>
						<ol>
							<li>
								<a
									href={`/api/auth/signin`}
									onClick={(e) => {
										e.preventDefault();
										signIn("google"); //Google, because it is only provider
									}}
								>
									{t("googlesignin")}
								</a>
							</li>
							<li>
								Salli sovelluksen lukea sähköpostiosoitteesi ja pääsy
								tallentamaan kuvia google driveen. <br />
								Pääsy on ainoastaan sovelluksen luomiin kuviin.
							</li>
							<li>Luo uusi tapahtuma.</li>
							<li>Jaa linkki.</li>
							<li>Lataa kuvia.</li>
						</ol>
						<p>Linkin saaneet näkevät kaikki ladatut kuvat.</p>
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
	const session = await getSession(context);
	return {
		props: {
			session,
			shouldSingOut: session ? IsUserBanned(session.user?.email) : false,
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
