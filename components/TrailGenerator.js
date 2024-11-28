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
  const [debugLogs, setDebugLogs] = useState([]);

  // Initial location fetch
  useEffect(() => {
    getUserLocation();
  }, []);

  // Enhanced debug logging for location updates
  useEffect(() => {
    if (location) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'location',
        data: {
          location,
          apiKeyPresent: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          apiKeyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length
        }
      };
      console.log('Location Debug:', logEntry);
      setDebugLogs(prev => [...prev, logEntry].slice(-5)); // Keep last 5 logs
    }
  }, [location]);

  // Enhanced debug logging for trail data
  useEffect(() => {
    if (trailData) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'trailData',
        data: {
          waypoints: trailData.waypoints,
          description: trailData.description,
          recommendedDistance: trailData.recommendedDistance
        }
      };
      console.log('Trail Data Debug:', logEntry);
      setDebugLogs(prev => [...prev, logEntry].slice(-5));
    }
  }, [trailData]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    console.log('Requesting user location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('Location successfully obtained:', {
          coordinates: newLocation,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
        setLocation(newLocation);
        setLoading(false);
      },
      (err) => {
        const errorMsg = `Error getting location: ${err.message}`;
        console.error('Geolocation error:', {
          code: err.code,
          message: err.message,
          timestamp: new Date().toISOString()
        });
        setError(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        {/* Status Banner */}
        {loading && (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
            Getting your location...
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Map Container */}
        <div className="h-[500px] rounded-lg overflow-hidden shadow-lg">
          {console.log('Rendering map with:', { 
            center: location, 
            waypoints: trailData?.waypoints,
            timestamp: new Date().toISOString() 
          })}
          {location ? (
            <Map 
              center={location} 
              waypoints={trailData?.waypoints}
              highlights={trailData?.highlights}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 text-gray-500">
              Please enable location access to view the map
            </div>
          )}
        </div>

        {/* Enhanced Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 space-y-4">
            {/* Current State */}
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Current State:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify({
                  location,
                  hasWaypoints: !!trailData?.waypoints,
                  waypointsCount: trailData?.waypoints?.length,
                  apiKeyPresent: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
                  apiKeyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length,
                  loading,
                  hasError: !!error
                }, null, 2)}
              </pre>
            </div>

            {/* Debug Logs */}
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">Recent Debug Logs:</h3>
              <div className="space-y-2">
                {debugLogs.map((log, index) => (
                  <div key={index} className="text-sm border-b border-gray-200 pb-2">
                    <div className="text-gray-500">{log.timestamp}</div>
                    <div className="font-medium">{log.type}</div>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}