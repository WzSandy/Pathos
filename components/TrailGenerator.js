// components/TrailGenerator.js
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import Map from './Map';

export default function TrailGenerator() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trailData, setTrailData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getUserLocation();
  }, []);

  // Debug log for trail data
  useEffect(() => {
    console.log('TrailData updated:', trailData);
  }, [trailData]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Location set:', newLocation);
          setLocation(newLocation);
          setLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Error getting location: ' + err.message);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <div className="h-[500px] rounded-lg overflow-hidden shadow-lg">
          {console.log('Rendering map with:', { center: location, waypoints: trailData?.waypoints })}
          {location ? (
            <Map 
              center={location} 
              waypoints={trailData?.waypoints}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
              Please enable location access to view the map
            </div>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold">Debug Info:</h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify({
                location,
                hasWaypoints: !!trailData?.waypoints,
                waypointsCount: trailData?.waypoints?.length,
                apiKeyPresent: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}