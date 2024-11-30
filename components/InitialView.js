import { useState } from 'react';
import { MapPin } from 'lucide-react';

export default function InitialView({ onLocationSet, loading, error }) {
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSet({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <button 
      onClick={getUserLocation}
      className="flex items-center gap-2.5 font-medium font-monument bg-[#F3D484] text-[#4A5D4F] rounded-full px-6 py-3 hover:bg-[#F3D484] transition-all transform hover:scale-105 mx-auto shadow-lg"
      disabled={loading}
    >
      <MapPin className="w-8 h-8 text-[#4A5D4F]" strokeWidth={1.5} />
      Get My Location
    </button>
  );
}