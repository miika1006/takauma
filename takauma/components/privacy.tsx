import { TFunction } from "next-i18next";
import Link from "next/link";
import styles from "../styles/privacy.module.css";

interface PrivacyProps {
	t: TFunction;
}

export default function Privacy({ t }: PrivacyProps) {
	const onMailClick = (el: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		const name = el.currentTarget.dataset.name;
		const domain = el.currentTarget.dataset.domain;
		const tld = el.currentTarget.dataset.tld;
		window.location.href = `mailto:${name}@${domain}.${tld}`;
		return false;
	};
	return (
		<article className={styles.footer}>
			<h1>Tietosuoja</h1>
			<p>Tällä sivulla on sovelluksen tietosuojaan liittyvät tiedot.</p>
			<p>
				Sovelluksessa pyritään käsittelemään vain välttämättömiä tietoja eikä
				tietoja jaeta eteenpäin.
			</p>
			<p>
				<i>Päivitetty: 19.6.2021</i>
			</p>

			<h2>Mitä tietoja käsitellään</h2>
			<h3>Henkilötiedot</h3>
			<ul>
				<li>
					<strong>Sähköpostiosoite</strong>
					<br />
					Käyttäjä pitää yksilöidä jollakin tiedolla. Tähän käytetään
					sähköpostiosoitetta, joka tallennetaan tietokantaan.
					Sähköpostiosoitetta ei jaeta eteenpäin, eikä siihen lähetetä
					roskapostia.
				</li>
				<li>
					<strong>Etunimi ja sukunimi</strong>
					<br />
					Kirjautumisessa saadaan käyttäjän nimi, joka voidaan esittää
					sovelluksessa, mutta sitä ei tallenneta eikä sitä käytetä mihinkään.
				</li>
				<li>
					<strong>Google Drive</strong>
					<br />
					Kuvat tallennetaan google driveen kansioihin. Jotta sovellus toimii,
					käyttäjän tulee antaa oikeudet sovellukselle lukea, kirjoittaa ja
					poistaa vain sovelluksen kautta ladattuja kuvia. Mitään muita kuvia
					tai tiedostoja ei käsitellä, eikä niihin ole oikeuksia.
				</li>
			</ul>
			<h3>Lapset</h3>
			<p>
				Sovellus ei kerää tietoja eikä jää mitään tietoja eteenpäin. Kuvat
				tallentuvat omaan pilvipalveluusi eikä niitä käsitellä mitenkään.
			</p>
			<h2>Miten tietoja käsitellään</h2>
			<h2>Miten tietoja jaetaan eteenpäin</h2>
			<h2>Kuinka kauan tietoja säilytetään</h2>
			<h2>Tietopyynnöt</h2>
			<p>Voit pyytää henkilötiedot mitä sinusta on kerätty.</p>
			<p>Voit myös pyytää että tietosi poistetaan.</p>
			<h2>Yhteydenotto</h2>
			<p>
				<a
					href="#"
					className={styles.cssmail}
					data-name="miikameht"
					data-domain="gmail"
					data-tld="com"
					onClick={onMailClick}
				></a>
			</p>
			<h2>Muutokset</h2>
			<p>
				Tietosuojaehtoja voidaan muuttaa tarvittaessa. Muutoksista tiedotetaan
				sivustolla.
			</p>
		</article>
	);
}
