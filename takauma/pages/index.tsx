import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Takauma</title>
        <meta name="description" content="Luo tapahtuma ja jaa linkki. Linkin saajat voivat ladata kuvia tapahtuman alle. Kuvat tallentuvat sivun pilvipalveluusi kansioihin." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
       TODO: Landing page
      </main>

      <footer className={styles.footer}>
      <Image src="/logo.svg" alt="Logo" width={72} height={72} />
         
      </footer>
    </div>
  )
}
