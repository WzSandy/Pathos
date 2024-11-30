// components/LoadingView.js
import { useEffect, useState } from 'react';

export default function LoadingView({ songData }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-8 animate-fadeIn">
      <div className="font-monument text-2xl">
        Generating Trail{dots}
      </div>
      
      {songData && (
        <div className="bg-gray-100 rounded-2xl p-6 max-w-md w-full mx-auto animate-slideUp">
          <h3 className="text-center font-monument mb-4">Selected Song</h3>
          <div className="space-y-2 text-center font-monument">
            <p>Track: {songData.track.name}</p>
            <p>Artist: {songData.track.artists[0].name}</p>
          </div>
        </div>
      )}
    </div>
  );
}