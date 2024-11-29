import { db } from '../utils/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const COLLECTION_NAME = 'trails';

export const trailService = {
  // Add a new trail
  async shareTrail(trailData) {
    try {
      // Convert waypoints array to object structure
      const formattedWaypoints = trailData.waypoints.map((waypoint, index) => ({
        index: index,
        lat: waypoint[0],
        lng: waypoint[1]
      }));

      // Format highlights to avoid nested arrays
      const formattedHighlights = trailData.highlights.map((highlight, index) => ({
        index: index,
        name: highlight.name,
        description: highlight.description,
        musicalConnection: highlight.musicalConnection,
        point: {
          lat: highlight.point[0],
          lng: highlight.point[1]
        }
      }));

      const trailToSave = {
        description: trailData.description,
        recommendedDistance: trailData.recommendedDistance,
        estimatedDuration: trailData.estimatedDuration,
        recommendedPace: trailData.recommendedPace,
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
          lat: trailData.startLocation.lat,
          lng: trailData.startLocation.lng
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

  // Subscribe to trail updates
  subscribeToTrails(callback, limitCount = 20) {
    const trailsQuery = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(trailsQuery, (snapshot) => {
      const trails = [];
      snapshot.forEach((doc) => {
        // Convert the Firestore data back to the format expected by the app
        const data = doc.data();
        const formattedTrail = {
          id: doc.id,
          ...data,
          // Convert waypoints back to array format
          waypoints: data.waypoints
            .sort((a, b) => a.index - b.index)
            .map(wp => [wp.lat, wp.lng]),
          // Convert highlights back to expected format
          highlights: data.highlights
            .sort((a, b) => a.index - b.index)
            .map(h => ({
              ...h,
              point: [h.point.lat, h.point.lng]
            }))
        };
        trails.push(formattedTrail);
      });
      callback(trails);
    });
  }
};