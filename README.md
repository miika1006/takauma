> [English](https://github.com/miika1006/takauma/blob/main/README_en.md)

# Takauma

Websovellus jossa voi luoda tapahtuman ja jakaa linkin, jonka kautta kuka tahansa voi ladata kuvia tapahtumalle. Tästä muodostuu takauma jostakin hetkestä. Kuvat tallentuvat käyttäjän oman pilvipalvelun tallennustilaan google driveen.

## Google Drivesta ja käyttöoikeuksista

Sovelluksessa käyttäjä kirjautuu sisään sovellukseen googletunnuksilla ja sallii sovellukselle oikeuden lukea käyttäjän sähköpostiosoitteen, joka esitetään sivulla infotietona ja jota käytetään kuvien lataukseen. Käyttäjä myös sallii sovellukselle pääsyn käyttäjän omaan Google Driveen. Kuvat ladataan Google Driveen kansioihin, jossa luotu kansio on tapahtuma sovelluksessa.

Sovellus näkee tai pääsee käsittelemään ainoastaan kansioita ja tiedostoja, joita sovelluksella on luotu. Sovelluksella ei ole oikeutta mihinkään muihin kuviin tai tiedostoihin.

Kirjautunut käyttäjä sitten luo uuden tapahtuman, jossa oikeasti luodaan uusi kansion Google Driveen annetulla tapahtuman nimellä.

Sovelluksessa kuka tahansa linkin saanut voi kirjautumatta ladata kuvia käyttäjän Google Driveen. Tästä tulee haaste googlen käyttöoikeuksien kanssa. Miten saadaan kuvat ladattua ja millä tunnuksella. Kirjautunut käyttäjä voi ladata kuvia kansioon, jollon ne tulevat kansioon käyttäjän luomina.

Mutta entä tilanne, jossa joku tuntematon käyttäjä kirjautumatta haluaa ladata kuvia?

Tätä varten tallennetaan käyttäjän googlelta saatu refresh-token tietokantaan talteen. Kun joku lataa kuvan sovelluksella, poimitaan refresh-token ja käytetään sitä googlen apikutsuihin autentikoimiseen.

Jos sovellus olisi yrityskäytössä voitaisi virittää palvelutunnus siten, että se toimii jonkin käyttäjätunnuksen puolesta.
Tähän ei käytetä service tunnusta, kun omistuksen siirtoa ei pysty tekemään julkisessa käytössä. Yrityskäytössä voitaisi toimia jonkin käyttäjän puolesta.

Google ei salli tiedostojen omistuksen siirtämistä eri @domain osoitteella olevien käyttäjien välillä. Eli ei pystytä siirtämään ladatun kuvan omistusta palvelutunnukselta käyttäjälle, joka kansion omistaa.

Jakolinkin luonnissa lisäksi jaetaan kansio julkiseksi internetiin. Sovellus siis muuttaa tässäkin Google Drive kansion jako-oikeuksia. Huomiona siis, että kaikki linkin tietäjät pääsevät näkemään kuvat. Tämä on täsmälleen sama tapa, kuin jos Google Drivestä suoraan jakaa kansioon linkin. Osoite on sellainen, jota ei pysty arvaamaan.

Kun kansio on jaettu internetiin, kuvia voi myös selata sovelluksessa täysikokoisina kuvina "kuvagalleriana". Tapahtumasta voi myöskin jakaa Google Drive kansion linkin suoraan, jolloin linkin saaja voi avata vaihtoehtoisesti Drive sovelluksella kansion.

### Versio 0.1.0

Proof of concept / MVP, NextJS opiskelua, Google Drive opiskelua, Node opiskelua.

- [x] Nextjs pohja
- [x] Etusivunäkymä, jossa info sovelluksesta ja kirjautuminen
- [x] Kirjautuminen google tunnuksella
- [x] Google drive yhdistäminen sovellukseen
- [x] Google drive kansion luonti tai olemassaolevan käyttö
- [x] Google drive kuvan/kuvien lähetys kansioon
- [x] Tapahtumien listausnäkymä
- [x] Tapahtuman valinta
- [x] Tapahtuman luontinäkymä
- [x] Jaettavan linkin luonti
- [x] Google drive linkin luonti
- [x] linkkien Jako whatsappiin tai mihin tahansa
- [x] Tapahtuman muokkausnäkymä
- [x] Tapahtumanäkymä
- [x] Kuvien listaus tapahtumaan
- [x] Kuvien lähetys tapahtumaan ja lataus google driveen
- [ ] Kuvalistauksen reaaliaikainen päivitys kaikille

### Versio 0.2.0

- [x] Kaiken koodin refraktorointia
- [x] Käytettävyyden parannuksia
- [x] Komponenttien parannuksia ja hieromista

## Vercel

Sovellus on julkaistu vercelillä.

Erikoisuuksia oli ympäristömuuttujissa. Jos ympäristömuuttujassa on \n (newline) rivivaihtoja. Vercelin web-käyttöliittymästä lisätessä, pitää korvata rivivaihtomerkit oikeilla rivinvaihdoilla. Ei esimerkiksi auta laittaa sisältöä " merkkien sisään.

Toinen säätö oli next-i18next kanssa. Vercel ei oletuksena löytänyt käännös json tiedostoja public/locales kansiosta. Korjaus löytyi, että piti lisätä next-i18next.config.js tiedostoon merkintä kansion sijainnista.

> localePath: path.resolve("./public/locales"),

# Nextjs dokumentaatiota

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
