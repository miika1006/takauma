import Header from "./header";
import Footer from "./footer";
import styles from "../styles/layout.module.css";
import { TFunction } from "next-i18next";
interface LayoutProps {
	children: React.ReactNode;
	t: TFunction;
	locale: string;
	padded?: boolean;
	centered?: boolean;
}

export default function Layout({
	children,
	t,
	locale,
	padded,
	centered,
}: LayoutProps) {
	return (
		<div className={styles.main}>
			<Header t={t} locale={locale} />
			<main>
				<div
					className={
						(padded === true ? styles.padded : "") +
						" " +
						(centered === true ? styles.centered : "")
					}
				>
					{children}
				</div>
			</main>
			<Footer t={t} />
		</div>
	);
}
