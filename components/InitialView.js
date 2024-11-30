// components/InitialView.js
import { useState } from 'react';

export default function InitialView({ onLocationSet, onSearch, loading, error }) {
  const [searchInput, setSearchInput] = useState('');

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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 transition-opacity duration-500">
      {/* Main Title Section */}
      <div className="text-center mb-16 animate-fadeIn">
        <h1 className="text-7xl font-monument font-bold mb-4">PATHOS</h1>
        <p className="text-xl font-monument">Every song carries the echoes of a place</p>
      </div>

      {/* Search Section */}
      <div className="w-full max-w-2xl space-y-6">
        <button 
          onClick={getUserLocation}
          className="flex items-center gap-2 font-monument bg-gray-100 rounded-full px-6 py-3 hover:bg-gray-200 transition-colors mx-auto"
          disabled={loading}
        >
          <span className="w-8 h-8 bg-gray-300 rounded-full"></span>
          Get My Location
        </button>

        {error && (
          <div className="text-red-500 text-center font-monument animate-fadeIn">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}