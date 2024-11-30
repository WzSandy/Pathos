// components/LoadingView.js
import { useEffect, useState } from 'react';
import EmbroideryBorder from './EmbroideryBorder';

export default function LoadingView({ songData }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#F5F0E6] flex flex-col items-center justify-center space-y-8 animate-fadeIn">
      <div className="font-regular font-monument text-2xl text-[#4A5D4F]">
        Generating Trail{dots}
      </div>
      
      {songData && (
        <div className="bg-[#F5F0E6] border-2 border-[#4A5D4F]/20 rounded-2xl p-6 max-w-md w-full mx-auto animate-slideUp">
          <div className="relative mb-4">
            <h3 className="text-center font-monument text-[#4A5D4F] text-lg">Selected Song</h3>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-[#4A5D4F]/30 rounded-full" />
          </div>
          <div className="space-y-2 text-center font-monument text-[#4A5D4F] text-lg">
            <p>Track: {songData.track.name}</p>
            <p>Artist: {songData.track.artists[0].name}</p>
          </div>
        </div>
      )}
    </div>
  );
  return (
    <EmbroideryBorder>
      {loadingContent}
    </EmbroideryBorder>
  );
}