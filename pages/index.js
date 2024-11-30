import { useState, useEffect } from 'react';
import Map from '../components/Map';
import { trailService } from '../services/firebaseTrailService';
import SharedTrailCard from '../components/SharedTrailCard';
import ErrorBoundary from '../components/ErrorBoundary';
import InitialView from '../components/InitialView';
import LoadingView from '../components/LoadingView';
import GeneratedTrailSection from '../components/GeneratedTrailSection';
import EmbroideryBorder from '../components/EmbroideryBorder';


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
      {/* Add these decorative gradients */}
  <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8A08D]/10 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4A5D4F]/5 rounded-full blur-3xl" />

      {/* Initial View */}
{!trailData && !loading && (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 animate-fadeIn">
    <div className="text-center mb-16">
      <h1 className="text-7xl text-[#323834] font-monument font-bold mb-4 relative">
        PATHOS
        </h1>
      <p className="text-xl text-[#323834] font-monument">Every song carries the echoes of a place.</p>
    </div>

    <div className="w-full max-w-2xl space-y-6">
      <InitialView 
        onLocationSet={setLocation}
        loading={loading}
        error={error}
      />

      {location && (
        <div className="relative animate-slideUp">
          <input
            type="text"
            placeholder="(song and artist name)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full font-monument text-center py-3 px-4 rounded-full bg-[#F5F0E6] border-2 border-[#323834]/20 text-[#323834] placeholder-[#323834]/40 focus:outline-none focus:border-[#4A5D4F] transition-all shadow-sm hover:shadow-md"
          />
          <button
            onClick={generateTrail}
            disabled={loading || !searchInput}
            className="absolute right-2 top-1/2 -translate-y-1/2 font-medium font-monument bg-[#4A5D4F] text-[#F5F0E6] rounded-full px-6 py-2 hover:bg-[#3A4A3E] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
  <div className="fixed inset-0 p-7 bg-[#F5F0E6]">
    <EmbroideryBorder>
      <div className="w-full h-full flex flex-col items-center justify-center space-y-8 animate-fadeIn">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8A08D]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4A5D4F]/5 rounded-full blur-3xl" />

        <div className="font-monument text-2xl text-[#323834]">
          Generating Trail<span className="animate-pulse">...</span>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-[#4A5D4F]/20 rounded-full" />
        </div>
        
        {songData && (
          <div className="bg-[#F5F0E6] border-2 border-[#4A5D4F]/20 rounded-2xl p-6 max-w-md w-full mx-auto animate-slideUp">
            <div className="relative mb-8">
              <h3 className="text-center font-monument text-[#4A5D4F] text-xl">Selected Song</h3>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-[#4A5D4F]/30 rounded-full" />
            </div>
            <div className="space-y-2 text-center font-monument text-[#4A5D4F] text-lg">
              <p>Track: {songData.track.name}</p>
              <p>Artist: {songData.track.artists[0].name}</p>
            </div>
          </div>
        )}
      </div>
    </EmbroideryBorder>
  </div>
)}

      {/* Generated Trail View */}
      {trailData && !loading && (
        <GeneratedTrailSection 
        trailData={trailData}
        onShare={shareTrail}
        shareStatus={shareStatus}
        sharedTrails={sharedTrails}
        hasGeneratedTrail={hasGeneratedTrail}
        />
        )}
        </div>
);
}