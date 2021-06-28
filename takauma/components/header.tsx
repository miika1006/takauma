import Link from "next/link";
import Head from "next/head";
import { getSession, signIn, signOut, useSession } from "next-auth/client";
import styles from "../styles/header.module.css";
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
				<title>Takauma</title>
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
							<span
								className={styles.notSignedInText + " " + styles.specialtext}
							>
								{t("youarenotsigned")}
							</span>
							<a
								href={`/api/auth/signin`}
								className={styles.buttonPrimary}
								onClick={(e) => {
									e.preventDefault();
									signIn("google"); //Google, because it is only provider
								}}
							>
								{t("googlesignin")}
							</a>
						</>
					)}
					{session?.user && (
						<>
							<span
								style={{ backgroundImage: `url(${session.user.image})` }}
								className={styles.avatar}
							/>
							<span className={styles.signedInText + " " + styles.specialtext}>
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
			<nav>
				<ul className={styles.navItems + " " + styles.specialtext}>
					{session && (
						<>
							<li className={styles.navItem}>
								<Link href="/">
									<a>{t("home")}</a>
								</Link>
							</li>
							<li className={styles.navItem}>
								<Link href="/events">
									<a>{t("eventstitle")}</a>
								</Link>
							</li>
						</>
					)}
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

			<div className={styles.headerbar}></div>
		</header>
	);
}
