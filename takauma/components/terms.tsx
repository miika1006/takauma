import { TFunction } from "next-i18next";
import Link from "next/link";
import Contact from "../components/contact";

interface TermsProps {
	t: TFunction;
}

export default function Terms({ t }: TermsProps) {
	return (
		<article>
			<h1>{t<string>("termsofservice")}</h1>
			<p>{t<string>("termsgeneral")}</p>

			<p>
				<i>{t<string>("updated")}: 19.6.2021</i>
			</p>
			<h2>{t<string>("misconduct")}</h2>
			<p>{t<string>("misconductgeneral")}</p>
			<h2>{t<string>("liability")}</h2>
			<p>{t<string>("liabilitygeneral")}</p>

			<Contact t={t} />

			<h2>{t<string>("changes")}</h2>
			<p>{t<string>("ghangesgeneral")}</p>
		</article>
	);
}
