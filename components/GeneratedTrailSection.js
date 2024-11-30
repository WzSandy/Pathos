import React from 'react';
import Map from './Map';
import SharedTrailCard from './SharedTrailCard';

const GeneratedTrailSection = ({ trailData, onShare, shareStatus, sharedTrails, hasGeneratedTrail }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <h2 className="font-monument font-bold text-2xl">Generated Trail</h2>
        
        {/* Metrics and Share Button Container */}
        <div className="flex items-center justify-between">
          <div className="flex-grow text-center">
            <p className="font-monument text-base inline-block">
              Distance: {trailData.recommendedDistance} km | Duration: {trailData.estimatedDuration} minutes | Pace: {trailData.recommendedPace} km/h
            </p>
          </div>
          <button
            onClick={onShare}
            disabled={shareStatus.sharing}
            className="font-monument bg-black text-white px-4 py-2 rounded-full ml-4"
          >
            {shareStatus.sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Trail Description */}
      {trailData.description && (
        <div className="w-full bg-gray-50 rounded-2xl p-6 animate-slideUp">
          <p className="font-monument text-base leading-relaxed">
            {trailData.description}
          </p>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden animate-slideUp">
        <Map 
          center={trailData.startLocation || (trailData.waypoints && trailData.waypoints[0] ? {
            lat: trailData.waypoints[0][0],
            lng: trailData.waypoints[0][1]
          } : null)}
          waypoints={trailData.waypoints} 
          highlights={trailData.highlights} 
        />
      </div>

      {/* Highlights Section */}
      {trailData.highlights?.length > 0 && (
        <div className="bg-gray-100 rounded-2xl p-6 space-y-6 animate-slideUp">
          <h3 className="font-bold font-monument text-xl">Trail Highlights</h3>
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
      )}

      {/* Shared Trails Section */}
      {hasGeneratedTrail && sharedTrails?.length > 0 && (
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
  );
};

export default GeneratedTrailSection;