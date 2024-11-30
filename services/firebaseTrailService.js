import { db } from '../utils/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'trails';

const normalizeWaypoint = (wp) => {
  if (Array.isArray(wp)) {
    return [parseFloat(wp[0]), parseFloat(wp[1])];
  }
  return [parseFloat(wp.lat), parseFloat(wp.lng)];
};

export const trailService = {
  async shareTrail(trailData) {
    try {
      // Normalize waypoints to consistent format
      const formattedWaypoints = trailData.waypoints.map((waypoint, index) => {
        const [lat, lng] = normalizeWaypoint(waypoint);
        return { index, lat, lng };
      });

      // Normalize highlights
      const formattedHighlights = trailData.highlights.map((highlight, index) => ({
        index,
        name: highlight.name,
        description: highlight.description,
        musicalConnection: highlight.musicalConnection,
        point: {
          lat: parseFloat(highlight.point[0]),
          lng: parseFloat(highlight.point[1])
        }
      }));

      const trailToSave = {
        description: trailData.description,
        recommendedDistance: parseFloat(trailData.recommendedDistance),
        estimatedDuration: parseInt(trailData.estimatedDuration),
        recommendedPace: parseFloat(trailData.recommendedPace),
        songData: {
          track: {
            name: trailData.songData.track.name,
            artists: trailData.songData.track.artists.map(artist => ({
              name: artist.name
            })),
            album: {
              images: trailData.songData.track.album?.images || []
            }
          }
        },
        waypoints: formattedWaypoints,
        highlights: formattedHighlights,
        startLocation: {
          lat: parseFloat(trailData.startLocation.lat),
          lng: parseFloat(trailData.startLocation.lng)
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), trailToSave);
      return docRef.id;
    } catch (error) {
      console.error('Error sharing trail:', error);
      throw error;
    }
  },

  subscribeToTrails(callback, limitCount = 20) {
    const trailsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(trailsQuery, (snapshot) => {
      try {
        const trails = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Ensure waypoints are in correct format
          const waypoints = data.waypoints
            ?.sort((a, b) => a.index - b.index)
            ?.map(wp => [parseFloat(wp.lat), parseFloat(wp.lng)]) || [];

          // Add start/end points if missing
          if (data.startLocation && waypoints.length > 0) {
            const startPoint = [
              parseFloat(data.startLocation.lat),
              parseFloat(data.startLocation.lng)
            ];
            
            if (JSON.stringify(waypoints[0]) !== JSON.stringify(startPoint)) {
              waypoints.unshift(startPoint);
            }
            if (JSON.stringify(waypoints[waypoints.length - 1]) !== JSON.stringify(startPoint)) {
              waypoints.push(startPoint);
            }
          }

          // Format highlights
          const highlights = data.highlights
            ?.sort((a, b) => a.index - b.index)
            ?.map(h => ({
              name: h.name,
              description: h.description,
              musicalConnection: h.musicalConnection,
              point: [parseFloat(h.point.lat), parseFloat(h.point.lng)]
            })) || [];

          return {
            id: doc.id,
            description: data.description,
            recommendedDistance: parseFloat(data.recommendedDistance) || 0,
            estimatedDuration: parseInt(data.estimatedDuration) || 0,
            recommendedPace: parseFloat(data.recommendedPace) || 0,
            waypoints,
            highlights,
            songData: data.songData || {},
            startLocation: data.startLocation && {
              lat: parseFloat(data.startLocation.lat),
              lng: parseFloat(data.startLocation.lng)
            },
            createdAt: data.createdAt
          };
        });

        // Sort by creation date
        trails.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        callback(trails);
      } catch (error) {
        console.error('Error processing trails:', error);
        callback([]);
      }
    }, {
      includeMetadataChanges: false
    });
  }
};