import Header from "./header";
import Footer from "./footer";
import styles from "../styles/layout.module.css";
import { TFunction } from "next-i18next";
interface LayoutProps {
	children: React.ReactNode;
	t: TFunction;
	locale: string;
}

export default function Layout({ children, t, locale }: LayoutProps) {
	return (
		<div className={styles.main}>
			<Header t={t} locale={locale} />
			<main>{children}</main>
			<Footer t={t} />
		</div>
	);
}
