import Header from "./header";
import Footer from "./footer";
import styles from "../styles/layout.module.css";
import { TFunction } from "../common/types";
interface LayoutProps {
	children: React.ReactNode;
	t: TFunction;
	locale: string;
	padded?: boolean;
	centered?: boolean;
	title?: string;
	description?: string;
}

export default function Layout({
	children,
	t,
	locale,
	padded,
	centered,
	title,
	description,
}: LayoutProps) {
	return (
		<div className={styles.main}>
			<Header t={t} locale={locale} title={title} description={description} />
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
