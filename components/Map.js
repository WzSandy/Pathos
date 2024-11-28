// components/Map.js
import React from 'react';
import { useEffect, useRef } from 'react';
import { useState } from 'react';

export default function Map({ center, waypoints, highlights }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const infoWindowsRef = useRef([]);
  const markersRef = useRef([]);
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  useEffect(() => {
    if (!center) {
      setError('No location coordinates available');
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('Maps API configuration error');
      return;
    }

    // Only load script if Google Maps isn't already loaded
    if (!window.google?.maps && !mapsLoaded) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,directions&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapsLoaded(true);
        initializeMap();
      };
      script.onerror = () => {
        setError('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    async function initializeMap() {
      try {
        setStatus('loading');
        
        // Create or update map instance
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
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(center);
        }

        // Clear existing markers and info windows
        markersRef.current.forEach(marker => marker.setMap(null));
        infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
        markersRef.current = [];
        infoWindowsRef.current = [];

        // Clear any existing markers and add new marker for current location
        const marker = new window.google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
          title: 'Your Location'
        });

        // Handle waypoints if they exist
        if (waypoints?.length >= 2) {
          // Clear previous directions
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null);
          }

          const directionsService = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true  // Add this line to suppress default markers
          });

          // Add custom markers for each waypoint
          if (highlights?.length) {
            highlights.forEach((highlight, index) => {
              if (!highlight.point) return;
              
              const position = { 
                lat: parseFloat(highlight.point[0]), 
                lng: parseFloat(highlight.point[1]) 
              };

              const marker = new window.google.maps.Marker({
                position,
                map: mapInstanceRef.current,
                label: String.fromCharCode(65 + index),
                title: highlight.name
              });

              const infoWindow = new window.google.maps.InfoWindow({
                content: `<div class="p-2 max-w-xs">
                  <h3 class="font-bold text-lg mb-1">${highlight.name}</h3>
                  <p class="text-sm mb-2">${highlight.description}</p>
                  <p class="text-sm italic text-gray-600">${highlight.musicalConnection}</p>
                </div>`
              });

              marker.addListener('click', () => {
                infoWindowsRef.current.forEach(window => window.close());
                infoWindow.open(mapInstanceRef.current, marker);
              });

              markersRef.current.push(marker);
              infoWindowsRef.current.push(infoWindow);
            });
          }

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
              console.error('Directions request failed:', status);
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
    }

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [center, waypoints, highlights, mapsLoaded]);

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
              status,
              mapsLoaded
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