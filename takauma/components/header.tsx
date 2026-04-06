import Link from "next/link";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import styles from "../styles/header.module.css";
import { TFunction } from "../common/types";
import { useRouter } from "next/router";

interface HeaderProps {
	t: TFunction;
	locale: string;
}

export default function Header({ t, locale }: HeaderProps) {
	const router = useRouter();

	const { data: session, status } = useSession();
	const loading = status === "loading";

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
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
				<meta name="msapplication-TileColor" content="#ffffff" />
				<meta name="theme-color" content="#ffffff" />

				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
					key="viewport"
				/>
				<title>Takauma</title>
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
