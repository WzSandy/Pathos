import { useState } from 'react';
import Map from '../components/Map';

export default function Home() {
  const [searchInput, setSearchInput] = useState('');
  const [location, setLocation] = useState(null);
  const [songData, setSongData] = useState(null);
  const [trailData, setTrailData] = useState(null);
  const [waypoints, setWaypoints] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user's location when component mounts
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setError(null);
        },
        (error) => {
          setError("Error getting location: " + error.message);
          console.error("Error getting location:", error);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  // Handle song search and trail generation
  const generateTrail = async () => {
    if (!location || !searchInput) {
      setError("Please provide both location and song information");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Search for song and get audio features
      const spotifyRes = await fetch('/api/spotify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: searchInput })
      });
      
      if (!spotifyRes.ok) {
        throw new Error('Failed to fetch song data');
      }
      
      const songResult = await spotifyRes.json();
      setSongData(songResult);

      // 2. Generate trail based on audio features
      const trailRes = await fetch('/api/generate-trail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFeatures: songResult.audioFeatures,
          location: location
        })
      });

      if (!trailRes.ok) {
        throw new Error('Failed to generate trail');
      }

      const generatedTrail = await trailRes.json();
      setTrailData(generatedTrail);
      setWaypoints(generatedTrail.waypoints);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Pathos AI Trail Generator</h1>
      
      {/* Location and Search Section */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <button 
            onClick={getUserLocation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            Get My Location
          </button>
          
          <input
            type="text"
            placeholder="Enter song name and artist..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={generateTrail}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
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
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="font-semibold text-lg mb-2">Generated Trail</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>{trailData.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
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
        <div className="bg-white p-4 rounded-lg shadow mb-6">
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

      {/* Map Section */}
      {location && (
        <div className="w-full max-w-4xl mx-auto">
          <Map center={location} waypoints={waypoints} />
        </div>
      )}
    </div>
  );
}