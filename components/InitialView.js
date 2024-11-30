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
      className="flex items-center gap-2 font-monument bg-gray-100 rounded-full px-6 py-3 hover:bg-gray-200 transition-colors mx-auto"
      disabled={loading}
    >
      <MapPin className="w-8 h-8 text-gray-600" strokeWidth={1.5} />
      Get My Location
    </button>
  );
}