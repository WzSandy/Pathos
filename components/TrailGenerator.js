// components/TrailGenerator.js
import { useState } from 'react';
import Map from './Map';

export default function TrailGenerator() {
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [songData, setSongData] = useState(null);
  const [trailData, setTrailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          setError('Error getting location: ' + err.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  // Handle song search and trail generation
  const generateTrail = async () => {
    if (!location || !searchQuery) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Search for song and get audio features
      const spotifyRes = await fetch('/api/spotify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery })
      });
      
      if (!spotifyRes.ok) {
        throw new Error('Failed to fetch song data');
      }
      
      const songData = await spotifyRes.json();
      setSongData(songData);

      // 2. Generate trail based on audio features
      const trailRes = await fetch('/api/generate-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFeatures: songData.audioFeatures,
          location: location
        })
      });

      if (!trailRes.ok) {
        throw new Error('Failed to generate trail');
      }

      const generatedTrail = await trailRes.json();
      setTrailData(generatedTrail);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <button
              onClick={getUserLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              Get My Location
            </button>
            
            <input
              type="text"
              placeholder="Enter song name and artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={generateTrail}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              disabled={loading || !location}
            >
              {loading ? 'Generating...' : 'Generate Trail'}
            </button>
          </div>

          {error && (
            <div className="text-red-500 p-3 bg-red-50 rounded">
              {error}
            </div>
          )}

          {location && (
            <div className="text-sm text-gray-600">
              Located at: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Trail Information */}
        {trailData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Generated Trail</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{trailData.description}</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="font-medium">Distance:</span>{' '}
                  {trailData.recommendedDistance} km
                </div>
                <div>
                  <span className="font-medium">Duration:</span>{' '}
                  {trailData.estimatedDuration} minutes
                </div>
                <div>
                  <span className="font-medium">Pace:</span>{' '}
                  {trailData.recommendedPace} km/h
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Song Information */}
        {songData && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Selected Song</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Track:</span> {songData.track.name}
              </p>
              <p>
                <span className="font-medium">Artist:</span>{' '}
                {songData.track.artists[0].name}
              </p>
            </div>
          </div>
        )}

        {/* Map */}
        <Map 
          center={location} 
          waypoints={trailData?.waypoints} 
        />
      </div>
    </div>
  );
}