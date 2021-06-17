  
import Layout from '../components/layout'
import Image from 'next/image'

export default function Page () {
  return (
    <Layout>
      <h1>Takauma</h1>
      <Image src="/logo.svg" alt="Logo" width={100} height={100} />
      <p>
        This is an example site to demonstrate how to use <a href={`https://next-auth.js.org`}>NextAuth.js</a> for authentication.
      </p>
    </Layout>
  )
}