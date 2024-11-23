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

  // Debug logs
  console.log('Map Component Received:', { center, waypoints });

  useEffect(() => {
    if (!center) return;
    console.log('Initializing map with center:', center);

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"]
    });

    let isMounted = true;

    const initializeMap = async () => {
      try {
        setStatus('loading');
        console.log('Loading Google Maps...');
        const google = await loader.load();
        
        if (!isMounted || !mapRef.current) {
          console.log('Component unmounted or ref missing');
          return;
        }

        // Initialize map if not already initialized
        if (!mapInstanceRef.current) {
          console.log('Creating new map instance');
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom: 14,
            styles: [
              {
                featureType: 'landscape',
                stylers: [{ color: '#f5f5f5' }]
              },
              {
                featureType: 'water',
                stylers: [{ color: '#86c5da' }]
              }
            ]
          });
        } else {
          console.log('Updating existing map center');
          mapInstanceRef.current.setCenter(center);
        }

        // Clear previous directions
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        // If we have waypoints, render the route
        if (waypoints?.length >= 2) {
          console.log('Processing waypoints:', waypoints);
          const directionsService = new google.maps.DirectionsService();
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: false,
            polylineOptions: {
              strokeColor: '#FF0000',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });

          const origin = { lat: waypoints[0][0], lng: waypoints[0][1] };
          const destination = { 
            lat: waypoints[waypoints.length - 1][0], 
            lng: waypoints[waypoints.length - 1][1] 
          };

          const middleWaypoints = waypoints.slice(1, -1).map(point => ({
            location: new google.maps.LatLng(point[0], point[1]),
            stopover: true
          }));

          console.log('Requesting directions with waypoints');
          const request = {
            origin,
            destination,
            waypoints: middleWaypoints,
            travelMode: google.maps.TravelMode.WALKING,
            optimizeWaypoints: true
          };

          directionsService.route(request, (result, status) => {
            if (status === "OK" && isMounted) {
              console.log('Directions received successfully');
              directionsRendererRef.current.setDirections(result);
              setStatus('ready');
            } else {
              console.error('Directions failed:', status);
              setStatus('error');
            }
          });
        } else {
          console.log('No waypoints provided, showing map only');
          setStatus('ready');
        }
      } catch (error) {
        console.error('Map initialization error:', error);
        setStatus('error');
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, [center, waypoints]);

  if (status === 'error') {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-red-50 text-red-500">
        Error loading map
      </div>
    );
  }

  if (status !== 'ready') {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-gray-50">
        Loading map...
      </div>
    );
  }

  return <div ref={mapRef} className="h-[500px] w-full" />;
}