import Header from "./header";
import Footer from "./footer";
import styles from "./layout.module.css";
import { TFunction } from "next-i18next";
interface LayoutProps {
	children: React.ReactNode;
	t: TFunction;
}

export default function Layout({ children, t }: LayoutProps) {
	return (
		<div className={styles.main}>
			<Header t={t} />
			<main>{children}</main>
			<Footer />
		</div>
	);
}
