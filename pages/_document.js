import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,directions,geometry`}
          async
          defer
        />
        <link 
          rel="preload" 
          href="/fonts/ABCMonumentGrotesk-Regular-Trial.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/ABCMonumentGrotesk-Medium-Trial.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/ABCMonumentGrotesk-Bold-Trial.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/fonts/ABCMonumentGrotesk-Light-Trial.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
      </Head>
      <body className="antialiased font-monument">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
