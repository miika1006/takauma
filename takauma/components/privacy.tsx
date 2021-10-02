import { TFunction } from "next-i18next";
import Contact from "../components/contact";

interface PrivacyProps {
	t: TFunction;
}

export default function Privacy({ t }: PrivacyProps) {
	return (
		<article>
			<h1>{t("privacypolicy")}</h1>
			<p>{t("privacy_0")}</p>
			<p>{t("privacy_1")}</p>
			<p>
				<i>{t("updated")}: 2.10.2021</i>
			</p>

			<h2>{t("privacy_what_info_is_handled")}</h2>
			<h3>{t("privacy_personal_data")}</h3>
			<ul>
				<li>
					<strong>{t("privacy_email_address")}</strong>
					<br />
					{t("privacy_email_desc")}
				</li>
				<li>
					<strong>Google Drive</strong>
					<br />
					{t("privacy_googledrive_desc")}
				</li>
			</ul>
			<h3>{t("privacy_photo_analyze")}</h3>
			<p>{t("privacy_photo_analyze_desc")}</p>

			<h3>{t("privacy_analytics")}</h3>
			<p>{t("privacy_analytics_desc_0")}</p>
			<p>{t("privacy_analytics_desc_1")}</p>

			<h2>{t("privacy_how_data_is_processed")}</h2>
			<p>{t("privacy_how_data_is_processed_desc")}</p>

			<h2>{t("privacy_how_data_is_shared")}</h2>
			<p>{t("privacy_how_data_is_shared_desc")}</p>

			<h2>{t("privacy_how_long_data_iskept")}</h2>
			<p>{t("privacy_how_long_data_iskept_desc")}</p>

			<h2>{t("privacy_enquiries")}</h2>
			<p>{t("privacy_enquiries_desc_0")}</p>
			<p>{t("privacy_enquiries_desc_1")}</p>

			<Contact t={t} />
			<h2>{t("privacy_changes")}</h2>
			<p>{t("privacy_changes_desc")}</p>
		</article>
	);
}
