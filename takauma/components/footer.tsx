import { TFunction } from "next-i18next";
import Link from "next/link";
import styles from "../styles/footer.module.css";

interface FooterProps {
	t: TFunction;
}

export default function Footer({ t }: FooterProps) {
	return (
		<footer className={styles.footer}>
			<hr />
			<ul className={styles.navItems}>
				<li className={styles.navItem}>
					<Link href="/privacy">
						<a>{t("privacypolicy")}</a>
					</Link>
				</li>
				<li className={styles.navItem}>
					<Link href="/terms">
						<a>{t("termsofservice")}</a>
					</Link>
				</li>

				<li className={styles.navItemRight}>
					<em>
						{t("createdby")} Miika (
						<a href="https://github.com/miika1006">miika1006</a>)
					</em>
				</li>
			</ul>
		</footer>
	);
}
