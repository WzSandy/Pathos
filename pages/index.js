import { useState, useEffect } from 'react';
import Map from '../components/Map';
import { trailService } from '../services/firebaseTrailService';
import SharedTrailCard from '../components/SharedTrailCard';
import ErrorBoundary from '../components/ErrorBoundary';
import InitialView from '../components/InitialView';
import LoadingView from '../components/LoadingView';

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
  // Add this with your other useState declarations at the top
  const [loadingSharedTrails, setLoadingSharedTrails] = useState(true);

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

  // In Home.js, update the useEffect for trail subscription:
useEffect(() => {
  let mounted = true;
  let lastUpdateTime = 0;
  const UPDATE_THRESHOLD = 2000; // 2 seconds minimum between updates

  setLoadingSharedTrails(true); // Set loading true when starting
  
  const unsubscribe = trailService.subscribeToTrails((updatedTrails) => {
    if (!mounted) return;

    const now = Date.now();
    if (now - lastUpdateTime < UPDATE_THRESHOLD) return;
    lastUpdateTime = now;
    
    setSharedTrails(prevTrails => {
      // Only update if the trails have actually changed
      const hasChanges = updatedTrails.length !== prevTrails.length ||
        updatedTrails.some((trail, i) => trail.id !== prevTrails[i]?.id);
      
      if (hasChanges) {
        return updatedTrails;
      }
      return prevTrails;
    });

    setLoadingSharedTrails(false); // Set loading false after update
  });

  return () => {
    mounted = false;
    unsubscribe();
  };
}, []); // Remove any dependencies

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
      <div className="bg-gray-100 rounded-2xl p-6 space-y-6 animate-slideUp">
        <h3 className="font-monument text-xl">Trail Highlights</h3>
        {trailData.highlights.map((highlight, index) => (
          <div key={index} className="bg-white p-6 rounded-xl">
            <div className="flex gap-4">
              <span className="font-monument font-bold">
                {String.fromCharCode(65 + index)}
              </span>
              <div>
                <h4 className="font-monument font-bold">{highlight.name}</h4>
                <p className="font-monument mt-2">{highlight.description}</p>
                <p className="font-monument text-gray-500 italic mt-1">
                  {highlight.musicalConnection}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative">
      {/* Initial View */}
      {!trailData && !loading && (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 animate-fadeIn">
          <div className="text-center mb-16">
            <h1 className="text-7xl font-monument font-bold mb-4">PATHOS</h1>
            <p className="text-xl font-monument">Every song carries the echoes of a place</p>
          </div>

          <div className="w-full max-w-2xl space-y-6">
            <button 
              onClick={getUserLocation}
              className="flex items-center gap-2 font-monument bg-gray-100 rounded-full px-6 py-3 hover:bg-gray-200 transition-colors mx-auto"
              disabled={loading}
            >
              <span className="w-8 h-8 bg-gray-300 rounded-full"></span>
              Get My Location
            </button>

            {location && (
              <div className="relative animate-slideUp">
                <input
                  type="text"
                  placeholder="(song and artist name)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full font-monument text-center py-3 px-4 rounded-full bg-gray-100"
                />
                <button
                  onClick={generateTrail}
                  disabled={loading || !searchInput}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-monument bg-black text-white rounded-full px-6 py-2"
                >
                  Generate Trail
                </button>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center font-monument animate-fadeIn">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading View */}
      {loading && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center space-y-8 animate-fadeIn">
          <div className="font-monument text-2xl">
            Generating Trail<span className="animate-pulse">...</span>
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
      )}

      {/* Generated Trail View */}
      {trailData && !loading && (
        <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fadeIn">
          <div className="text-center space-y-4">
            <h2 className="font-monument text-2xl">Generated Trail</h2>
            <div className="flex justify-between items-center">
              <p className="font-monument text-base">
                Distance: {trailData.recommendedDistance} km | 
                Duration: {trailData.estimatedDuration} minutes | 
                Pace: {trailData.recommendedPace} km/h
              </p>
              <button
                onClick={shareTrail}
                disabled={shareStatus.sharing}
                className="font-monument bg-black text-white px-4 py-2 rounded-full"
              >
                {shareStatus.sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>

          <div className="w-full aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden animate-slideUp">
            <Map 
              center={location} 
              waypoints={trailData.waypoints} 
              highlights={trailData.highlights} 
            />
          </div>

          {renderHighlights()}

          {hasGeneratedTrail && (
            <div className="mt-16 animate-slideUp">
              <h2 className="text-xl font-monument font-bold mb-6">Shared Trails</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sharedTrails.map((trail) => (
                  <SharedTrailCard key={trail.id} trail={trail} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}