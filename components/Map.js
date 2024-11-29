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
  const scriptLoadedRef = useRef(false);

  // First useEffect to handle script loading only
  useEffect(() => {
    if (window.google?.maps || scriptLoadedRef.current) return;

    const loadScript = () => {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,directions`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadScript();
  }, []);

  // Second useEffect to handle map initialization and updates
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current || !window.google?.maps) {
        return;
      }

      try {
        setStatus('loading');

        // Clean up existing instances
        if (mapInstanceRef.current) {
          mapInstanceRef.current = null;
        }
        markersRef.current.forEach(marker => marker.setMap(null));
        infoWindowsRef.current.forEach(window => window.close());
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        // Create new map instance
        const mapOptions = {
          center: { lat: center.lat, lng: center.lng },
          zoom: 14,
          mapTypeId: 'roadmap',
          fullscreenControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          zoomControl: true
        };

        await new Promise(resolve => setTimeout(resolve, 0));
        if (!isMounted || !mapRef.current) return;

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Add marker for user location
        const userMarker = new window.google.maps.Marker({
          position: { lat: center.lat, lng: center.lng },
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });
        markersRef.current.push(userMarker);

        // Handle waypoints and create route
        if (waypoints?.length >= 2) {
          const directionsService = new window.google.maps.DirectionsService();
          directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true, // Hide default markers
            polylineOptions: {
              strokeColor: '#4285F4',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
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
            if (status === 'OK' && isMounted) {
              directionsRendererRef.current?.setDirections(result);

              // Add highlight markers
              if (highlights?.length) {
                highlights.forEach((highlight, index) => {
                  if (!highlight.point) return;

                  const marker = new window.google.maps.Marker({
                    position: { 
                      lat: parseFloat(highlight.point[0]), 
                      lng: parseFloat(highlight.point[1]) 
                    },
                    map: mapInstanceRef.current,
                    label: {
                      text: String.fromCharCode(65 + index),
                      color: '#FFFFFF'
                    },
                    title: highlight.name,
                    icon: {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 12,
                      fillColor: '#34A853',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }
                  });

                  const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; max-width: 200px;">
                        <h3 style="font-weight: bold; margin-bottom: 4px;">${highlight.name}</h3>
                        <p style="font-size: 14px; margin-bottom: 4px;">${highlight.description}</p>
                        <p style="font-size: 14px; font-style: italic; color: #666;">${highlight.musicalConnection}</p>
                      </div>
                    `,
                    maxWidth: 250
                  });

                  marker.addListener('click', () => {
                    infoWindowsRef.current.forEach(window => window.close());
                    infoWindow.open(mapInstanceRef.current, marker);
                  });

                  markersRef.current.push(marker);
                  infoWindowsRef.current.push(infoWindow);
                });
              }
            } else {
              console.error('Directions request failed:', status);
            }
          });
        }

        if (isMounted) {
          setStatus('ready');
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        if (isMounted) {
          setError(err.message);
        }
      }
    };

    const checkAndInitialize = () => {
      if (window.google?.maps) {
        initializeMap();
      } else {
        setTimeout(checkAndInitialize, 100);
      }
    };

    checkAndInitialize();

    return () => {
      isMounted = false;
      markersRef.current.forEach(marker => marker.setMap(null));
      infoWindowsRef.current.forEach(window => window.close());
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [center, waypoints, highlights]);

  return (
    <div className="h-[500px] w-full relative">
      {error ? (
        <div className="h-full flex items-center justify-center bg-red-50 text-red-500">
          <p>{error}</p>
        </div>
      ) : status !== 'ready' ? (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading map...</p>
          </div>
        </div>
      ) : null}
      <div ref={mapRef} className="h-full w-full absolute top-0 left-0" />
    </div>
  );
}