// components/SharedTrails.js
import React, { useEffect, useState } from 'react';
import { trailService } from '../services/firebaseTrailService';

const SharedTrails = ({ userLocation }) => {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = trailService.subscribeToTrails((updatedTrails) => {
      setTrails(updatedTrails);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6">Shared Trails</h2>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6">Shared Trails</h2>
        <div className="bg-red-50 text-red-600 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold mb-6">Shared Trails</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trails.map((trail) => (
          <div key={trail.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-48 relative">
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?size=400x300&path=color:0x0000ff|weight:5${trail.waypoints.map(p => `|${p[0]},${p[1]}`).join('')}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                alt="Trail Map"
                className="w-full h-full object-cover"
              />
              {trail.songInfo?.albumArt && (
                <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                  <img
                    src={trail.songInfo.albumArt}
                    alt="Album Art"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">
                {trail.songInfo?.name || 'Generated Trail'}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {trail.songInfo?.artist}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{trail.metrics.distance} km</span>
                <span>{trail.metrics.duration} min</span>
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
  );
};

export default SharedTrails;