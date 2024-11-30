import "@/styles/globals.css";
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Verify Google Maps loading
    const checkGoogleMapsLoaded = () => {
      if (!window.google?.maps) {
        console.error('Google Maps failed to load. Please check your API key and network connection.');
      }
    };

    // Check after a reasonable delay
    const timer = setTimeout(checkGoogleMapsLoaded, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="font-monument min-h-screen">
      <Component {...pageProps} />
    </main>
  );
}
