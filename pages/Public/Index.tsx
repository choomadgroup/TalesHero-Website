import Head from 'next/head';
import Header from '../../src/Components/Header';
import Content from '../../src/Views/Content';
import Footer from '../../src/Components/Footer';

// Next.js SSR — halaman utama dirender di server untuk SEO optimal
export default function Home() {
  return (
    <>
      <Head>
        <title>Tales Hero Indonesia — Game Online Action Adventure</title>
        <meta name="description" content="Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!" />
        <meta name="keywords" content="tales hero, game online, action adventure, game indonesia, RPG indonesia" />
        <meta property="og:title" content="Tales Hero Indonesia" />
        <meta property="og:description" content="Game Online Action Adventure terbaik di Indonesia. Petualangan dalam berbagai legenda termashur di dunia!" />
        <meta property="og:image" content="/Image/tales-hero-banner.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tales Hero Indonesia" />
        <meta name="twitter:description" content="Game Online Action Adventure terbaik di Indonesia!" />
        <meta name="twitter:image" content="/Image/tales-hero-banner.png" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Header />
      <Content />
      <Footer />
    </>
  );
}
