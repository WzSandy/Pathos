import OpenAI from 'openai';
import axios from 'axios';
import { getWikiInformation } from '../../services/wikiService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getNearbyPlaces(center, radius = 5000) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radius}&type=point_of_interest&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    const placesWithDetails = await Promise.all(
      response.data.results.map(async place => {
        try {
          const detailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,reviews,editorial_summary,types,user_ratings_total,price_level,opening_hours,business_status&key=${process.env.GOOGLE_MAPS_API_KEY}`
          );

          const wikiData = await getWikiInformation(place.name, place.vicinity);
          
          return {
            name: place.name,
            location: [place.geometry.location.lat, place.geometry.location.lng],
            types: place.types,
            details: detailsResponse.data.result,
            wikiData: wikiData,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            vicinity: place.vicinity
          };
        } catch (error) {
          console.error(`Error fetching details for ${place.name}:`, error);
          return {
            name: place.name,
            location: [place.geometry.location.lat, place.geometry.location.lng],
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            vicinity: place.vicinity
          };
        }
      })
    );
    
    return placesWithDetails;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audioFeatures, location } = req.body;

  if (!audioFeatures || !location) {
    return res.status(400).json({ error: 'Audio features and location are required' });
  }

  try {
    const nearbyPlaces = await getNearbyPlaces(location);
    
    const moodAnalysis = audioFeatures?.moodAnalysis || {
      primaryMood: 'balanced',
      emotionalIntensity: 5,
      atmosphericQuality: 'balanced'
    };

    const movementAnalysis = audioFeatures?.movementAnalysis || {
      intensityLevel: 5,
      suggestedPace: '4.0',
      rhythmPattern: { complexity: 4, consistency: 'steady' }
    };

    const environmentalPreferences = audioFeatures?.environmentalPreferences || {
      trailType: 'balanced',
      terrainComplexity: 5,
      sceneryPreference: 'mixed'
    };

    const lyricsAnalysis = audioFeatures?.lyricsAnalysis || {
      natureReferences: { flora: [], fauna: [], elements: [] },
      locations: { nature: [], urban: [] },
      moodKeywords: { positive: [], negative: [], energetic: [], calm: [] },
      timeReferences: { daylight: [], night: [] },
      weatherReferences: { weather: [], seasons: [] }
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are Pathos, an AI trail designer that crafts personalized walking experiences by 
          translating musical characteristics into physical journeys. Your expertise lies in creating meaningful 
          connections between musical elements and geographical features, ensuring each trail tells a story that 
          resonates with the song's essence.
          You must ONLY use locations from the provided AVAILABLE NEARBY PLACES list. 
          Do not invent or generate fictional places.

          Key Responsibilities:
          - Create circular routes that start and end at the user's current location
          - Select 3-5 waypoints from available nearby places that reflect the song's themes
          - Ensure a logical walking sequence between points
          - Match actual locations to musical and lyrical elements, as well as artist(s) context`
        },
        {
          role: "user",
          content: `Create a walking trail using ONLY these available locations and characteristics:

            STARTING LOCATION: [${location.lat}, ${location.lng}]
            
            AVAILABLE NEARBY PLACES:
            ${JSON.stringify(nearbyPlaces, null, 2)}
            
            MUSICAL ATMOSPHERE:
            - Primary Mood: ${moodAnalysis.primaryMood}
            - Emotional Intensity: ${moodAnalysis.emotionalIntensity}/10
            - Atmospheric Quality: ${moodAnalysis.atmosphericQuality}
            
            MOVEMENT DYNAMICS:
            - Intensity Level: ${movementAnalysis.intensityLevel}/10
            - Suggested Pace: ${movementAnalysis.suggestedPace} km/h
            - Rhythm Pattern: ${movementAnalysis.rhythmPattern.complexity}/4 time, ${movementAnalysis.rhythmPattern.consistency} rhythm
            
            ENVIRONMENTAL PREFERENCES:
            - Trail Type: ${environmentalPreferences.trailType}
            - Terrain Complexity: ${environmentalPreferences.terrainComplexity}/10
            - Scenery Preference: ${environmentalPreferences.sceneryPreference}

            LYRICAL THEMES:
            - Nature Elements: ${JSON.stringify(lyricsAnalysis.natureReferences)}
            - Location References: ${JSON.stringify(lyricsAnalysis.locations)}
            - Mood Keywords: ${JSON.stringify(lyricsAnalysis.moodKeywords)}
            - Time of Day: ${JSON.stringify(lyricsAnalysis.timeReferences)}
            - Weather/Seasons: ${JSON.stringify(lyricsAnalysis.weatherReferences)}
            
            Create a circular route that starts and ends at the current location. Select 3-5 waypoints from the available places.
            When specifying metrics:
            1. First determine the recommendedDistance (2-10 km) based on the song's length and intensity
            2. Then choose a recommendedPace (3-6 km/h) based on the song's tempo and mood
            3. The estimatedDuration will be calculated as (recommendedDistance / recommendedPace) * 60 minutes

            Respond with JSON:
            {
              "description": "A detailed description connecting musical elements to the trail experience,
              including how the trail reflects the song's theme and tonality, and how it connects to the artist's
              background. Avoid repetitive and generic wording, reference actual location names and artist quotes
              and maybe interviews",
              "technicalDetails": {
                "recommendedDistance": number,  // 2-10 km
                "estimatedDuration": number,    // 30-120 minutes
                "recommendedPace": number,      // 3-6 km/h
                "terrainType": "string",
                "elevationChange": number      // 0-100 meters
              },
              "waypoints": [
                {
                  "name": "string",
                  "location": [lat, lng],
                  "description": "string",
                  "musicalConnection": "string"
                }
              ]
            }`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const rawResponse = JSON.parse(completion.choices[0].message.content);
    
    // Extract waypoint coordinates and ensure start/end at user location
    const waypointCoordinates = rawResponse.waypoints && rawResponse.waypoints.length > 0 
      ? [
          [location.lat, location.lng], // Start at user location
          ...rawResponse.waypoints.map(wp => wp.location),
          [location.lat, location.lng]  // End at user location
        ]
      : null;

    // Add Wiki data to waypoints if available
    const enrichedWaypoints = rawResponse.waypoints.map(waypoint => {
      const matchingPlace = nearbyPlaces.find(place => 
        Math.abs(place.location[0] - waypoint.location[0]) < 0.0001 && 
        Math.abs(place.location[1] - waypoint.location[1]) < 0.0001
      );

      return {
        ...waypoint,
        description: matchingPlace?.wikiData?.summary || waypoint.description
      };
    });

    const formattedResponse = {
      description: rawResponse.description,
      recommendedDistance: parseFloat(rawResponse.technicalDetails.recommendedDistance).toFixed(2),
      estimatedDuration: parseInt(rawResponse.technicalDetails.estimatedDuration),
      recommendedPace: parseFloat(rawResponse.technicalDetails.recommendedPace).toFixed(1),
      technicalDetails: {
        recommendedDistance: parseFloat(rawResponse.technicalDetails.recommendedDistance).toFixed(2),
        estimatedDuration: parseInt(rawResponse.technicalDetails.estimatedDuration),
        recommendedPace: parseFloat(rawResponse.technicalDetails.recommendedPace).toFixed(1),
        terrainType: rawResponse.technicalDetails.terrainType || 'mixed terrain',
        elevationChange: rawResponse.technicalDetails.elevationChange || 10
      },
      waypoints: waypointCoordinates,
      highlights: enrichedWaypoints.map(wp => ({
        point: wp.location,
        name: wp.name,
        description: wp.description,
        musicalConnection: wp.musicalConnection
      }))
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error('Trail generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate trail',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function generateWaypoints(center, distance = 2) {
  const R = 6371;
  const points = [];
  const numPoints = 6;

  if (!center?.lat || !center?.lng || isNaN(distance)) {
    throw new Error('Invalid center point or distance');
  }

  const radiusInDeg = (distance / (2 * Math.PI * R)) * 360;

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const lat = center.lat + (radiusInDeg * Math.cos(angle));
    const lng = center.lng + (radiusInDeg * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180));
    points.push([lat, lng]);
  }

  // Ensure the route starts and ends at the user's location
  points[0] = [center.lat, center.lng];
  points.push([center.lat, center.lng]);
  
  return points;
}