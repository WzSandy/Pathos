import React, { useState, useEffect, useRef } from 'react';

const SharedTrailCard = React.memo(({ trail }) => {
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const mapContainer = mapRef.current;

    const initializeMap = () => {
      if (!mapContainer || !window.google?.maps || !trail?.waypoints?.length) return;

      try {
        // Clear existing map instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current = null;
        }

        // Create new map instance
        const bounds = new window.google.maps.LatLngBounds();
        mapInstanceRef.current = new window.google.maps.Map(mapContainer, {
          zoom: 14,
          mapTypeId: 'roadmap',
          disableDefaultUI: true, // Disable UI controls for card view
          gestureHandling: 'none' // Prevent interaction
        });

        // Create path coordinates and extend bounds
        const pathCoordinates = trail.waypoints.map(wp => {
          const point = new window.google.maps.LatLng(
            Array.isArray(wp) ? wp[0] : wp.lat,
            Array.isArray(wp) ? wp[1] : wp.lng
          );
          bounds.extend(point);
          return point;
        });

        // Draw the path
        new window.google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: mapInstanceRef.current
        });

        // Add start marker
        if (pathCoordinates.length > 0) {
          new window.google.maps.Marker({
            position: pathCoordinates[0],
            map: mapInstanceRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
        }

        // Add highlight markers
        trail.highlights?.forEach((highlight, index) => {
          const point = Array.isArray(highlight.point) 
            ? new window.google.maps.LatLng(highlight.point[0], highlight.point[1])
            : new window.google.maps.LatLng(highlight.point.lat, highlight.point.lng);

          new window.google.maps.Marker({
            position: point,
            map: mapInstanceRef.current,
            label: {
              text: String.fromCharCode(65 + index),
              color: '#FFFFFF'
            },
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#34A853',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
        });

        // Fit map to bounds with padding
        mapInstanceRef.current.fitBounds(bounds, {
          top: 30,
          right: 30,
          bottom: 30,
          left: 30
        });

        if (isMounted) {
          setMapLoaded(true);
          setMapError(false);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        if (isMounted) {
          setMapError(true);
        }
      }
    };

    // Initialize map when Google Maps is ready
    if (window.google?.maps) {
      initializeMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(checkGoogleMaps);
          initializeMap();
        }
      }, 100);

      // Clean up interval
      return () => clearInterval(checkGoogleMaps);
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [trail?.waypoints, trail?.highlights]);

  const openInMaps = () => {
    try {
      if (!trail?.waypoints?.length) return;
      
      const start = trail.waypoints[0];
      const end = trail.waypoints[trail.waypoints.length - 1];
      
      const startStr = Array.isArray(start) 
        ? `${start[0]},${start[1]}` 
        : `${start.lat},${start.lng}`;
      const endStr = Array.isArray(end)
        ? `${end[0]},${end[1]}`
        : `${end.lat},${end.lng}`;

      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${startStr}&destination=${endStr}&travelmode=walking`,
        '_blank'
      );
    } catch (error) {
      console.error('Error opening maps:', error);
    }
  };

  return (
    <div className="bg-[#F5F0E6] border-2 border-[#4A5D4F]/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="relative w-full aspect-[4/3] bg-[#E5E5E5] overflow-hidden">
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A5D4F]"></div>
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Map unavailable
          </div>
        )}
        <div 
          ref={mapRef}
          className={`w-full h-full ${mapLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
        {trail.songData?.track?.album?.images?.[0]?.url && (
  <div className="absolute bottom-3 right-3 w-12 h-12 rounded-full overflow-hidden border-2 border-[#F5F0E6] shadow-md">
    <img
      src={trail.songData.track.album.images[0].url}
      alt="Album Art"
      className="w-full h-full object-cover"
      loading="lazy"
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
      }}
    />
  </div>
)}
      </div>
      <div className="p-4 space-y-3">
      <div className="space-y-1">
  <h3 className="font-monument font-bold text-[#323834] line-clamp-1">
    {trail.songData?.track?.name || 'Generated Trail'}
  </h3>
  <p className="font-monument text-sm text-[#4A5D4F]">
    {trail.songData?.track?.artists?.[0]?.name || 'Unknown Artist'}
  </p>
</div>
<div className="flex items-center justify-between pt-2 border-t border-[#4A5D4F]/10">
  <div className="flex items-center gap-2">
    <span className="font-monument text-sm text-[#4A5D4F]">
      {parseFloat(trail.recommendedDistance).toFixed(1)} km
    </span>
  </div>
  <button
    onClick={openInMaps}
    className="font-monument text-sm bg-[#4A5D4F] text-[#F5F0E6] px-3 py-1 rounded-full hover:bg-[#3A4A3E] transition-colors"
  >
    Open in Maps
  </button>
</div>
      </div>
    </div>
  );
});

SharedTrailCard.displayName = 'SharedTrailCard';

export default SharedTrailCard;