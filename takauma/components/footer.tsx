import { TFunction } from "../common/types";
import Link from "next/link";
import Contact from "./contact";
import styles from "../styles/footer.module.css";
import Image from "next/image";

interface FooterProps {
	t: TFunction;
}

export default function Footer({ t }: FooterProps) {
	return (
		<footer className={styles.footer}>
			<ul className={styles.navItems}>
				<li className={styles.navItem}>
					<Link href="/" className={styles.app}>
						<Image src="/logo.svg" alt="Logo" width={40} height={40} />
						<h4 className={styles.apptitle}>{t("apptitle")}</h4>
						<p className={styles.appdesc}>{t("appdescription")}</p>
					</Link>
				</li>

				<li className={styles.navItemRight}>
					<Contact t={t} hideTitle={true} />
				</li>

				<li className={styles.navItem}>
					<Link href="/privacy">{t("privacypolicy")}</Link>
				</li>
				<li className={styles.navItem}>
					<Link href="/terms">{t("termsofservice")}</Link>
				</li>
			</ul>
		</footer>
	);
}
