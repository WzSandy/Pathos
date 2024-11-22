import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function Map({ center, waypoints }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoader, setMapLoader] = useState(null);

  // Initialize the loader once
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"]
    });
    setMapLoader(loader);
  }, []);

  // Handle map initialization and updates
  useEffect(() => {
    if (!mapLoader || !center) {
      return;
    }

    let isMounted = true;

    const initializeMap = async () => {
      try {
        await mapLoader.load();

        // Check if component is still mounted
        if (!isMounted || !mapRef.current) {
          return;
        }

        // Only create new map if it doesn't exist
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: center,
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
          mapInstanceRef.current = map;
        } else {
          // If map exists, just update the center
          mapInstanceRef.current.setCenter(center);
        }

        // Clear existing markers
        if (mapInstanceRef.current._markers) {
          mapInstanceRef.current._markers.forEach(marker => marker.setMap(null));
        }
        mapInstanceRef.current._markers = [];

        // Add start marker
        const startMarker = new google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
          title: 'Start/End Point'
        });
        mapInstanceRef.current._markers.push(startMarker);

        if (waypoints && waypoints.length > 0) {
          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: false,
            preserveViewport: false,
            polylineOptions: {
              strokeColor: '#FF0000',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });
          directionsRenderer.setMap(mapInstanceRef.current);

          const wayPointObjects = waypoints.slice(1, -1).map(point => ({
            location: new google.maps.LatLng(point[0], point[1]),
            stopover: true
          }));

          directionsService.route({
            origin: new google.maps.LatLng(waypoints[0][0], waypoints[0][1]),
            destination: new google.maps.LatLng(waypoints[waypoints.length-1][0], waypoints[waypoints.length-1][1]),
            waypoints: wayPointObjects,
            travelMode: google.maps.TravelMode.WALKING,
            optimizeWaypoints: true
          }, (result, status) => {
            if (isMounted) {
              if (status === "OK") {
                directionsRenderer.setDirections(result);
              } else {
                setError(`Directions request failed: ${status}`);
              }
            }
          });
        }

        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [center, waypoints, mapLoader]);

  if (error) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-red-50 text-red-500">
        Error loading map: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-gray-50">
        Loading map...
      </div>
    );
  }

  return <div ref={mapRef} className="h-[500px] w-full" />;
}