import "@/styles/globals.css";
import { useEffect } from 'react';
import EmbroideryBorder from '@/components/EmbroideryBorder';

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
    <div className="fixed inset-0 p-7 bg-[#F5F0E6]">
      <EmbroideryBorder>
        <Component {...pageProps} />
      </EmbroideryBorder>
    </div>
  );
}
