import Link from "next/link";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import styles from "../styles/header.module.css";
import { TFunction } from "../common/types";
import { useRouter } from "next/router";

const BASE_URL = "https://takauma.vercel.app";

const OG_LOCALE: Record<string, string> = {
	fi: "fi_FI",
	en: "en_US",
};

interface HeaderProps {
	t: TFunction;
	locale: string;
	title?: string;
	description?: string;
}

export default function Header({ t, locale, title, description }: HeaderProps) {
	const router = useRouter();
	const { data: session, status } = useSession();
	const loading = status === "loading";

	const pageTitle = title ? `${title} | Takauma` : "Takauma";
	const pageDescription = description ?? t("appdescription");

	// Canonical and alternate URLs (fi is default locale — no prefix)
	const pathWithoutLocale = router.asPath.split("?")[0];
	const canonicalUrl =
		locale === "fi"
			? `${BASE_URL}${pathWithoutLocale}`
			: `${BASE_URL}/${locale}${pathWithoutLocale}`;
	const fiUrl = `${BASE_URL}${pathWithoutLocale}`;
	const enUrl = `${BASE_URL}/en${pathWithoutLocale}`;
	const ogLocale = OG_LOCALE[locale] ?? "fi_FI";
	const ogLocaleAlternate = locale === "fi" ? OG_LOCALE["en"] : OG_LOCALE["fi"];
	const ogImage = `${BASE_URL}/android-chrome-512x512.png`;

	return (
		<header
			className={
				router.route !== "/events/[event]" &&
				router.route !== "/privacy" &&
				router.route !== "/terms"
					? ""
					: styles.headerminimal
			}
		>
			<Head>
				{/* Primary meta */}
				<title>{pageTitle}</title>
				<meta name="description" content={pageDescription} />
				<link rel="canonical" href={canonicalUrl} />

				{/* hreflang for i18n */}
				<link rel="alternate" hrefLang="fi" href={fiUrl} />
				<link rel="alternate" hrefLang="en" href={enUrl} />
				<link rel="alternate" hrefLang="x-default" href={fiUrl} />

				{/* Open Graph */}
				<meta property="og:type" content="website" />
				<meta property="og:site_name" content="Takauma" />
				<meta property="og:title" content={pageTitle} />
				<meta property="og:description" content={pageDescription} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:image" content={ogImage} />
				<meta property="og:image:width" content="512" />
				<meta property="og:image:height" content="512" />
				<meta property="og:locale" content={ogLocale} />
				<meta property="og:locale:alternate" content={ogLocaleAlternate} />

				{/* Twitter Card */}
				<meta name="twitter:card" content="summary" />
				<meta name="twitter:title" content={pageTitle} />
				<meta name="twitter:description" content={pageDescription} />
				<meta name="twitter:image" content={ogImage} />

				{/* Favicons & PWA */}
				<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
				<meta name="msapplication-TileColor" content="#ffffff" />
				<meta name="theme-color" content="#ffffff" />
				<meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
			</Head>

			<noscript>
				<style>{`.nojs-show { opacity: 1; top: 0; }`}</style>
			</noscript>
			<div
				className={
					styles.headerbar +
					" " +
					styles.centered +
					" " +
					(router.route !== "/" ? styles.headerbar_dark : "")
				}
			>
				{router.route !== "/events/[event]" &&
					router.route !== "/privacy" &&
					router.route !== "/terms" && (
						<div className={styles.signedInStatus}>
							<p
								className={`nojs-show ${
									!session && loading ? styles.loading : styles.loaded
								}`}
							>
								{!session && (
									<a
										href={`/api/auth/signin`}
										className={styles.buttonPrimary}
										onClick={(e) => {
											e.preventDefault();
											signIn("google", {
												callbackUrl: window.location.origin + "/events",
											});
										}}
									>
										{t("googlesignin")}
									</a>
								)}
								{session?.user && (
									<>
										<span
											className={styles.signedInText + " " + styles.specialtext}
										>
											<small>{t("signedinas")}</small>
											<br />
											<strong>{session.user.email || session.user.name}</strong>
										</span>
										<a
											href={`/api/auth/signout`}
											className={styles.button + " " + styles.specialtext}
											onClick={(e) => {
												e.preventDefault();
												signOut();
											}}
										>
											{t("signout")}
										</a>
									</>
								)}
							</p>
						</div>
					)}
				<nav>
					<ul className={styles.navItems + " " + styles.specialtext}>
						<>
							{router.route !== "/" && (
								<li className={styles.navItem}>
									<Link href="/">{t("home")}</Link>
								</li>
							)}
							{session && (
								<li className={styles.navItem}>
									<Link href="/events">{t("eventstitle")}</Link>
								</li>
							)}
						</>
						<li className={styles.navItemRight}>
							<Link
								href={router.asPath}
								locale={"fi"}
								className={locale === "fi" ? styles.boldtext : styles.normaltext}
							>
								Suomi
							</Link>
							&nbsp;|&nbsp;
							<Link
								href={router.asPath}
								locale={"en"}
								className={locale === "en" ? styles.boldtext : styles.normaltext}
							>
								English
							</Link>
						</li>
					</ul>
				</nav>
			</div>
		</header>
	);
}
