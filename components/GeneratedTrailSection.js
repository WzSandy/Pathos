import React from 'react';
import Map from './Map';
import SharedTrailCard from './SharedTrailCard';

const GeneratedTrailSection = ({ trailData, onShare, shareStatus, sharedTrails, hasGeneratedTrail }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fadeIn bg-[#F5F0E6]">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <h2 className="font-monument font-bold text-2xl text-[#1A1A1A]">Generated Trail</h2>
        
        {/* Metrics and Share Button Container */}
        <div className="flex items-center justify-between">
          <div className="flex-grow text-center">
            <p className="font-monument text-base inline-block text-[#4A5D4F]">
              Distance: {trailData.recommendedDistance} km | Duration: {trailData.estimatedDuration} minutes | Pace: {trailData.recommendedPace} km/h
            </p>
          </div>
          <button
            onClick={onShare}
            disabled={shareStatus.sharing}
            className="font-monument bg-[#4A5D4F] text-[#F5F0E6] px-4 py-2 rounded-full ml-4 hover:bg-[#3A4A3E] transition-colors"
          >
            {shareStatus.sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Trail Description */}
      {trailData.description && (
        <div className="w-full bg-white rounded-2xl p-6 animate-slideUp border border-[#4A5D4F]/10">
          <p className="font-monument text-base leading-relaxed text-[#1A1A1A]">
            {trailData.description}
          </p>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full aspect-[16/9] bg-[#F5F0E6] rounded-2xl overflow-hidden animate-slideUp shadow-sm">
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
        <div className="bg-[#4A5D4F] rounded-2xl p-6 space-y-6 animate-slideUp text-[#F5F0E6]">
          <h3 className="font-bold font-monument text-xl">Trail Highlights</h3>
          {trailData.highlights.map((highlight, index) => (
            <div key={index} className="bg-[#F5F0E6] p-6 rounded-xl">
              <div className="flex gap-4">
                <span className="font-monument font-bold text-[#E8A08D]">
                  {String.fromCharCode(65 + index)}
                </span>
                <div>
                  <h4 className="font-monument font-bold text-[#4A5D4F]">{highlight.name}</h4>
                  <p className="font-monument mt-2 text-[#1A1A1A]">{highlight.description}</p>
                  <p className="font-monument text-[#4A5D4F] italic mt-1">
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
          <h2 className="text-xl font-monument font-bold mb-6 text-[#1A1A1A]">Shared Trails</h2>
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