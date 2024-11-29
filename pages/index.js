import { useState, useEffect } from 'react';
import Map from '../components/Map';
import { trailService } from '../services/firebaseTrailService';

export default function Home() {
  const [searchInput, setSearchInput] = useState('');
  const [location, setLocation] = useState(null);
  const [songData, setSongData] = useState(null);
  const [trailData, setTrailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sharedTrails, setSharedTrails] = useState([]);
  const [hasGeneratedTrail, setHasGeneratedTrail] = useState(false);
  const [shareStatus, setShareStatus] = useState({ sharing: false, error: null });

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

  // Subscribe to shared trails updates
  useEffect(() => {
    if (location) {
      const unsubscribe = trailService.subscribeToTrails((updatedTrails) => {
        setSharedTrails(updatedTrails);
      });

      return () => unsubscribe();
    }
  }, [location]);

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
      setHasGeneratedTrail(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Share trail to Firebase
  const shareTrail = async () => {
    if (!trailData || !songData) {
      setError("No trail data to share");
      return;
    }

    setShareStatus({ sharing: true, error: null });
    try {
      await trailService.shareTrail({
        waypoints: trailData.waypoints,
        highlights: trailData.highlights,
        description: trailData.description,
        recommendedDistance: trailData.recommendedDistance,
        estimatedDuration: trailData.estimatedDuration,
        recommendedPace: trailData.recommendedPace,
        songData: songData,
        startLocation: location,
        timestamp: new Date().toISOString()
      });
      
      setShareStatus({ sharing: false, error: null });
    } catch (error) {
      console.error('Error sharing trail:', error);
      setShareStatus({ sharing: false, error: "Failed to share trail" });
    }
  };

  // Display highlights information
  const renderHighlights = () => {
    if (!trailData?.highlights?.length) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold text-lg mb-4">Trail Highlights</h3>
        <div className="space-y-4">
          {trailData.highlights.map((highlight, index) => (
            <div key={index} className="border-b pb-3 last:border-b-0">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded mr-3">
                  {String.fromCharCode(65 + index)}
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">{highlight.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{highlight.description}</p>
                  <p className="text-sm text-gray-500 italic mt-1">{highlight.musicalConnection}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg mb-2">Generated Trail</h3>
            <button
              onClick={shareTrail}
              disabled={shareStatus.sharing}
              className={`px-4 py-2 rounded ${
                shareStatus.sharing 
                  ? 'bg-gray-400' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
            >
              {shareStatus.sharing ? 'Sharing...' : 'Share Trail'}
            </button>
          </div>
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

      {shareStatus.error && (
        <div className="text-red-500 p-3 bg-red-50 rounded mb-6">
          {shareStatus.error}
        </div>
      )}

      {/* Render Highlights */}
      {renderHighlights()}

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
        <div className="w-full h-[500px] max-w-4xl mx-auto mb-8 border border-gray-300 bg-gray-50">
          <Map 
            center={location} 
            waypoints={trailData?.waypoints || null} 
            highlights={trailData?.highlights || null}
          />
        </div>
      )}

      {/* Shared Trails Section */}
      {hasGeneratedTrail && (
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Shared Trails</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sharedTrails.map((trail) => (
              <div key={trail.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-48 relative">
                  <img 
                    src={`https://maps.googleapis.com/maps/api/staticmap?size=400x300&path=color:0x0000ff|weight:5${trail.waypoints.map(p => `|${p[0]},${p[1]}`).join('')}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                    alt="Trail Map"
                    className="w-full h-full object-cover"
                  />
                  {trail.songData?.track?.album?.images?.[0]?.url && (
                    <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                      <img
                        src={trail.songData.track.album.images[0].url}
                        alt="Album Art"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">
                    {trail.songData?.track?.name || 'Generated Trail'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {trail.songData?.track?.artists?.[0]?.name}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{trail.recommendedDistance} km</span>
                    <span>{trail.estimatedDuration} min</span>
                  </div>
                  <div className="mt-3 flex justify-end space-x-2">
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${trail.waypoints[0][0]},${trail.waypoints[0][1]}&destination=${trail.waypoints[trail.waypoints.length-1][0]},${trail.waypoints[trail.waypoints.length-1][1]}&travelmode=walking`, '_blank')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Open in Maps
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}