import { TFunction } from "next-i18next";
import Link from "next/link";
import styles from "../styles/contact.module.css";

interface ContactProps {
	t: TFunction;
	hideTitle?: boolean;
}

export default function Contact({ t, hideTitle }: ContactProps) {
	const onMailClick = (el: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		const name = el.currentTarget.dataset.name;
		const domain = el.currentTarget.dataset.domain;
		const tld = el.currentTarget.dataset.tld;
		window.location.href = `mailto:${name}@${domain}.${tld}`;
		return false;
	};
	return (
		<div>
			{!hideTitle && <h2>{t<string>("contact")}</h2>}
			<p>
				{t<string>("author")}: Miika Mehtälä. &nbsp;
				{t<string>("apprelatedcontact")}:{" "}
				<a
					href="#"
					className={styles.cssmail}
					data-name="miikameht"
					data-domain="gmail"
					data-tld="com"
					onClick={onMailClick}
				></a>
			</p>
		</div>
	);
}
