import { TFunction } from "next-i18next";
import Link from "next/link";
import Contact from "../components/contact";

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
		<article>
			<h1>{t("privacypolicy")}</h1>
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
					<strong>Profiilikuva</strong>
					<br />
					Kirjautumisessa yhtydessä on mahdollista hakea googlelta käyttäjän
					julkiseksi asettamia tietoja. Kuva esitetään sovelluksessa
					kirjautuneen käyttäjän sähköpostiosoitteen yhteydessä, mutta sitä ei
					tallenneta sovellukseen.
				</li>
				<li>
					<strong>Google Drive</strong>
					<br />
					Kuvat tallennetaan google driveen kansioihin. Jotta sovellus toimii,
					käyttäjän tulee antaa oikeudet sovellukselle lukea, kirjoittaa ja
					poistaa vain sovelluksen kautta ladattuja kuvia google drivessä.
					Mitään muita kuvia tai tiedostoja ei käsitellä, eikä niihin ole
					oikeuksia.
				</li>
			</ul>
			<h3>Lapset</h3>
			<p>
				Sovellus ei kerää tietoja eikä jaa niitä eteenpäin. Kuvat tallentuvat
				omaan pilvipalveluusi sellaisenaan ja ovat käytössä vain sinulla ja
				linkin saaneilla, niin kauan kun linkin jako on voimassa.
			</p>
			<h3>Seuranta</h3>
			<p>
				Sovellus laskee käyttömääriä, kuinka paljon sivulla on kävijöitä ja
				kuinka paljon toimintoja käytetään. Tietoja ei yhdistetä kirjautuneeseen
				käyttäjään. Laskennassa ei käytetä mitään analytiikkakirjastoa tai
				sovellusta. Käyttömäärät lasketaan suoraan sovelluksessa itsessään.
			</p>
			<h2>Miten tietoja käsitellään</h2>
			<p>
				Kirjautumisen yhteydessä tunnistetaan käyttäjä sähköpostiosoitteen
				perusteella ja se tallennetaan tietokantaan käyttäjän tunnistamiseksi.
			</p>
			<h2>Miten tietoja jaetaan eteenpäin</h2>
			<p>Tietoja ei jaeta eteenpäin minnekään.</p>
			<h2>Kuinka kauan tietoja säilytetään</h2>
			<p>
				Tiedot säilyvät niin kauan kun sovellus on toiminnassa tai kunnes pyydät
				että tietosi poistetaan. Kaikki sovelluksen keräämät tiedot poistetaan
				jos toiminta lakkaa. Kuvia ei poisteta Google Drivestä.
			</p>
			<h2>Tietopyynnöt</h2>
			<p>Voit pyytää henkilötiedot mitä sinusta on kerätty.</p>
			<p>Voit myös pyytää että tietosi poistetaan.</p>
			<p>Katso kohdasta yhteydenotto.</p>
			<Contact t={t} />
			<h2>Muutokset</h2>
			<p>
				Tietosuojaehtoja voidaan muuttaa tarvittaessa. Muutoksista tiedotetaan
				sivustolla.
			</p>
		</article>
	);
}
