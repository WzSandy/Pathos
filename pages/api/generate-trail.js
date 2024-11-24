// pages/api/generate-trail.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audioFeatures, location } = req.body;

  if (!audioFeatures || !location) {
    return res.status(400).json({ error: 'Audio features and location are required' });
  }

  try {
    // Safely access all required properties with defaults
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
          content: `You are an expert trail designer that creates walking paths based on musical characteristics and lyrics analysis. 
                   Your goal is to create an immersive experience that matches both the musical mood and lyrical themes.`
        },
        {
          role: "user",
          content: `Create a walking trail that embodies these characteristics:
        
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
            
            LOCATION:
            - Starting Point: ${location.lat}, ${location.lng}
            
            Generate a trail that:
            1. Matches the musical mood and rhythm
            2. Incorporates locations and elements mentioned in lyrics
            3. Considers time of day and weather references
            4. Creates a cohesive experience
            
            Respond with a JSON object containing:
            {
              "description": "A detailed description connecting musical elements to the trail experience",
              "technicalDetails": {
                "recommendedDistance": "number in km", // A number between 2-10
                "estimatedDuration": "number in minutes", // A number between 15-120
                "recommendedPace": "number in km/h", // A number between 2-6
                "terrainType": "description of terrain variations", 
                "elevationChange": "suggested elevation change in meters" // A number between 0-100
              },
              "waypoints": "array of [lat, lng] pairs for a circular route",
              "highlights": [
                {
                  "point": "[lat, lng]",
                  "description": "point description",
                  "musicalConnection": "how this point connects to the song"
                }
              ]
            }`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const rawResponse = JSON.parse(completion.choices[0].message.content);
    
    // Generate waypoints if none provided
    const waypoints = rawResponse.waypoints || generateWaypoints(location, 
      parseFloat(rawResponse.technicalDetails?.recommendedDistance || rawResponse.recommendedDistance || 2));

    // Format response with more detail
    const formattedResponse = {
      description: rawResponse.description,
      recommendedDistance: parseFloat(rawResponse.technicalDetails?.recommendedDistance || 2).toFixed(2), // Add this at top level
      estimatedDuration: parseInt(rawResponse.technicalDetails?.estimatedDuration || 30), // Add this at top level
      recommendedPace: parseFloat(rawResponse.technicalDetails?.recommendedPace || 4.0).toFixed(1), // Add this at top level
      technicalDetails: rawResponse.technicalDetails || {
        recommendedDistance: parseFloat(rawResponse.recommendedDistance || 2),
        estimatedDuration: parseInt(rawResponse.estimatedDuration || 30),
        recommendedPace: parseFloat(rawResponse.recommendedPace || 4.0),
        terrainType: 'mixed terrain',
        elevationChange: 10
      },
      waypoints: waypoints,
      highlights: rawResponse.highlights || []
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
  const R = 6371; // Earth's radius in km
  const points = [];
  const numPoints = 6; // Number of points in the route

  // Add input validation
  if (!center?.lat || !center?.lng || isNaN(distance)) {
    throw new Error('Invalid center point or distance');
  }

  // Convert distance to degrees (approximate)
  const radiusInDeg = (distance / (2 * Math.PI * R)) * 360;

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const lat = center.lat + (radiusInDeg * Math.cos(angle));
    const lng = center.lng + (radiusInDeg * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180));
    points.push([lat, lng]);
  }

  // Add start/end point to close the loop
  points.push([center.lat, center.lng]);

  return points;
}