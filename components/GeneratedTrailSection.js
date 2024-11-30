import React from 'react';
import Map from './Map';
import SharedTrailCard from './SharedTrailCard';

const EmbroiderySectionBorder = ({ children }) => {
    return (
      <div 
        className="relative p-7"
        style={{
            borderImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IArs4c6QAAAm9JREFUeF7tnUFWxCAQRM01vYgbl268iNfUrWF8+a9fFaRxym2TpvgU0JOZxOPj6+375eLv/fXz+B0e24/xq1z/IUa8DmoQoGcbEK8ALS6bAC0Co+ZloM+2JxJAio+AH5Z8gBLC6z01QGv8HlrHoSLA8fIHoJSf6k7apCn/bnHaEk9F+1+DC9AzlQA1L4EA3Q2oWe926eyH0nYEzIIDNEDNBMzppjuUyiwqjKu3C939VfWN7eU6VBVAQNT4bH0BOnxDQXUlTWiAdgdKM0hx8xmBd4Nm79HyHkrAKB6gxW9BA3SwDAFR43Ho4FC1LJkNVNVHhml3ygdoHHp5kMunvLqk4lBw6GpAs/u7fQ+dPcDV+QPUTDxAdwdanUHzeOV0pJ/i9jq02qFMwJyA9FM8QM0frQO0O1DzCmyXbvmSb0fALChAA9RMwJxuuUOrHZrHK6cj/RTPKd/9lK/OoGwpcwLST/E4tLtDzYZpl265Q9sRMAsK0AA1EzCnW+7Qaofm8crpSD/Fc8p3P+WrMyhbypyA9FM8Du3uULNh2qVb7tB2BMyCAjRAzQTM6W53aFWAefyYrqqv2j6/vjP/PDNAAxRX9WWD6hKutpcdSh1SXMPDV1P/anz5JyUSzEi0FtS/Gg/Qyc9ZZcnDs5/kYLtDx4RVAdRejc/WF6Ddn0ae7YA41OyA7YCSYK1o2f/qKp+87hLmPEDNiyJA7wZK/Y8zRO13j1ffSSLXobsDI/0BSoSK8QAtAqPmMtDqKUaCni0+8ksdKjogQEWAdO8iDhUBo0PH/PT2QlFPu8vpTKG6vPzvf9oRMAsK0AA1EzCnUx36A0YGZRG9X2tAAAAAAElFTkSuQmCC') 28 / 18px / 0 round",
            borderWidth: "28px",
            borderStyle: "solid"
        }}
      >
        {children}
      </div>
    );
  };

const GeneratedTrailSection = ({ trailData, onShare, shareStatus, sharedTrails, hasGeneratedTrail }) => {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-fadeIn bg-[#F5F0E6]">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <h2 className="font-monument font-bold text-2xl text-[#323834]">YOUR SONG TRAIL</h2>
        
        {/* Metrics and Share Button Container */}
        <div className="relative">
            <p className="font-monument text-base text-center text-[#4A5D4F]">
                Distance: {trailData.recommendedDistance} km | Duration: {trailData.estimatedDuration} minutes | Pace: {trailData.recommendedPace} km/h
                </p>
                <button
                onClick={onShare}
                disabled={shareStatus.sharing}
                className="absolute right-0 top-1/2 -translate-y-1/2 font-monument bg-[#4A5D4F] text-[#F5F0E6] px-4 py-2 rounded-full hover:bg-[#3A4A3E] transition-colors"
                >
    {shareStatus.sharing ? 'Sharing...' : 'Share'}
  </button>
</div>
      </div>

      {/* Trail Description */}
      {trailData.description && (
        <div className="w-4/5 max-w-2xl mx-auto p-6 bg-[#F5F0E6] rounded-2xl animate-slideUp">
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
        <div className="bg-[#F5F0E6] rounded-2xl p-6 space-y-6 animate-slideUp">
          <h3 className="font-bold font-monument text-xl text-[#323834] text-center">Trail Highlights</h3>
          {trailData.highlights.map((highlight, index) => (
            <div key={index} className="bg-[#F5F0E6] border-2 border-[#4A5D4F]/20 p-6 rounded-2xl">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#F3D484] rounded-full flex items-center justify-center">
                  <span className="font-monument font-bold text-[#4A5D4F]">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <div className="flex-grow">
                  <h4 className="font-monument font-bold text-[#323834]">{highlight.name}</h4>
                  <p className="font-monument mt-2 text-[#1A1A1A]">{highlight.description}</p>
                  <p className="font-monument text-[#4A5D4F] italic mt-2">
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
          <h2 className="text-xl text-center font-monument font-bold mb-6 text-[#1A1A1A]">Shared Trails</h2>
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