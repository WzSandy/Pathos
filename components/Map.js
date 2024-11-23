// components/Map.js
import React from 'react';
import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function Map({ center, waypoints }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!center) {
      setError('No location coordinates available');
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('Maps API configuration error');
      return;
    }

    // Create script tag for Google Maps
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,directions&v=weekly`;
      script.async = true;
      script.defer = true;
      return new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initializeMap = async () => {
      try {
        setStatus('loading');
        
        // Load Google Maps script if not already loaded
        if (!window.google?.maps) {
          await loadGoogleMapsScript();
        }

        // Create map instance
        if (!mapInstanceRef.current && mapRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 14,
            mapTypeId: 'roadmap',
            fullscreenControl: true,
            mapTypeControl: true,
            streetViewControl: true,
            zoomControl: true
          });

          // Add marker for current location
          new window.google.maps.Marker({
            position: center,
            map: mapInstanceRef.current,
            title: 'Your Location'
          });
        } else {
          mapInstanceRef.current?.setCenter(center);
        }

        // Handle waypoints if they exist
        if (waypoints?.length >= 2) {
          // Clear previous directions
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
          }

          const directionsService = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current
          });

          const request = {
            origin: { lat: waypoints[0][0], lng: waypoints[0][1] },
            destination: { 
              lat: waypoints[waypoints.length - 1][0], 
              lng: waypoints[waypoints.length - 1][1] 
            },
            waypoints: waypoints.slice(1, -1).map(point => ({
              location: { lat: point[0], lng: point[1] },
              stopover: true
            })),
            travelMode: 'WALKING',
            optimizeWaypoints: true
          };

          directionsService.route(request, (result, status) => {
            if (status === 'OK') {
              directionsRendererRef.current.setDirections(result);
              setStatus('ready');
            } else {
              setError(`Failed to get directions: ${status}`);
            }
          });
        } else {
          setStatus('ready');
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setError(err.message);
      }
    };

    initializeMap();

    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [center, waypoints]);

  if (error) {
    return (
      <div className="h-[500px] w-full flex flex-col items-center justify-center bg-red-50 text-red-500 p-4">
        <p className="font-bold mb-2">Error loading map</p>
        <p className="text-sm">{error}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 text-xs bg-white p-2 rounded overflow-auto max-w-full">
            {JSON.stringify({
              center,
              waypointsCount: waypoints?.length,
              apiKeyPresent: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
              status
            }, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[500px] w-full" />;
}