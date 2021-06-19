import Link from "next/link";
import Head from "next/head";
import { getSession, signIn, signOut, useSession } from "next-auth/client";
import styles from "./header.module.css";
import { TFunction } from "next-i18next";

// The approach used in this component shows how to built a sign in and sign out
// component that works on pages which support both client and server side
// rendering, and avoids any flash incorrect content on initial page load.

interface HeaderProps {
	t: TFunction;
	locale: string;
}

export default function Header({ t, locale }: HeaderProps) {
	const [session, loading] = useSession();
	return (
		<header>
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
				<title>Takauma</title>
				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
					key="viewport"
				/>
			</Head>
			<noscript>
				<style>{`.nojs-show { opacity: 1; top: 0; }`}</style>
			</noscript>
			<div className={styles.signedInStatus}>
				<p
					className={`nojs-show ${
						!session && loading ? styles.loading : styles.loaded
					}`}
				>
					{!session && (
						<>
							<span className={styles.notSignedInText}>
								You are not signed in
							</span>
							<a
								href={`/api/auth/signin`}
								className={styles.buttonPrimary}
								onClick={(e) => {
									e.preventDefault();
									signIn("google"); //Google, because it is only provider
								}}
							>
								Sign in
							</a>
						</>
					)}
					{session?.user && (
						<>
							<span
								style={{ backgroundImage: `url(${session.user.image})` }}
								className={styles.avatar}
							/>
							<span className={styles.signedInText}>
								<small>Signed in as</small>
								<br />
								<strong>{session.user.email || session.user.name}</strong>
							</span>
							<a
								href={`/api/auth/signout`}
								className={styles.button}
								onClick={(e) => {
									e.preventDefault();
									signOut();
								}}
							>
								Sign out
							</a>
						</>
					)}
				</p>
			</div>
			<nav>
				<ul className={styles.navItems}>
					<li className={styles.navItem}>
						<Link href="/">
							<a>{t("home")}</a>
						</Link>
					</li>
					<li className={styles.navItem}>
						<Link href="/protected">
							<a>Protected</a>
						</Link>
					</li>
					<li className={styles.navItemRight}>
						<Link href="/" locale={"fi"}>
							<a
								className={
									locale === "fi" ? styles.boldtext : styles.normaltext
								}
							>
								Suomi
							</a>
						</Link>
						&nbsp;|&nbsp;
						<Link href="/" locale={"en"}>
							<a
								className={
									locale === "en" ? styles.boldtext : styles.normaltext
								}
							>
								English
							</a>
						</Link>
					</li>
				</ul>
			</nav>
		</header>
	);
}