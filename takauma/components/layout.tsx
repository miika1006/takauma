import Header from "./header"
import Footer from "./footer"
import styles from "./layout.module.css"
interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.main}>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}