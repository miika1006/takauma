import { TFunction } from "next-i18next";
import Link from "next/link";
import Contact from "../components/contact";

interface TermsProps {
	t: TFunction;
}

export default function Terms({ t }: TermsProps) {
	const onMailClick = (el: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		const name = el.currentTarget.dataset.name;
		const domain = el.currentTarget.dataset.domain;
		const tld = el.currentTarget.dataset.tld;
		window.location.href = `mailto:${name}@${domain}.${tld}`;
		return false;
	};
	return (
		<article>
			<h1>{t("termsofservice")}</h1>
			<p>{t("termsgeneral")}</p>

			<p>
				<i>{t("updated")}: 19.6.2021</i>
			</p>
			<h2>{t("misconduct")}</h2>
			<p>{t("misconductgeneral")}</p>
			<h2>{t("liability")}</h2>
			<p>{t("liabilitygeneral")}</p>

			<Contact t={t} />

			<h2>{t("changes")}</h2>
			<p>{t("ghangesgeneral")}</p>
		</article>
	);
}
