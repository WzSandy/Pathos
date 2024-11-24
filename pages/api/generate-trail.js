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

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert trail designer that creates walking paths based on musical characteristics."
        },
        {
          role: "user",
      content: `Create a walking trail description based on these musical features:
        
        Mood & Atmosphere:
        - Primary Mood: ${audioFeatures.moodAnalysis.primaryMood}
        - Emotional Intensity: ${audioFeatures.moodAnalysis.emotionalIntensity}/10
        - Atmospheric Quality: ${audioFeatures.moodAnalysis.atmosphericQuality}
        
        Movement Characteristics:
        - Intensity Level: ${audioFeatures.movementAnalysis.intensityLevel}/10
        - Suggested Pace: ${audioFeatures.movementAnalysis.suggestedPace} km/h
        - Rhythm Pattern: ${audioFeatures.movementAnalysis.rhythmPattern.complexity}/4 time, ${audioFeatures.movementAnalysis.rhythmPattern.consistency} rhythm
        
        Environmental Preferences:
        - Trail Type: ${audioFeatures.environmentalPreferences.trailType}
        - Terrain Complexity: ${audioFeatures.environmentalPreferences.terrainComplexity}/10
        - Scenery Preference: ${audioFeatures.environmentalPreferences.sceneryPreference}
        
        Starting from coordinates: ${location.lat}, ${location.lng}
        
        Respond with a JSON object containing:
        {
          "description": "A detailed description of the trail atmosphere",
          "recommendedDistance": "A number in km (no units)",
          "estimatedDuration": "A number in minutes (no units)",
          "recommendedPace": "A number in km/h (no units)",
          "waypoints": "An array of [lat, lng] pairs for a circular route",
          "highlights": "Array of key points along the route with descriptions"
        }`
    }
  ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const rawResponse = JSON.parse(completion.choices[0].message.content);
    
    // Generate waypoints if none provided
    const waypoints = rawResponse.waypoints || generateWaypoints(location, parseFloat(rawResponse.recommendedDistance));

    const formattedResponse = {
      description: rawResponse.description,
      recommendedDistance: parseFloat(rawResponse.recommendedDistance),
      estimatedDuration: parseInt(rawResponse.estimatedDuration),
      recommendedPace: parseFloat(rawResponse.recommendedPace),
      waypoints: waypoints
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate trail' });
  }
}

function generateWaypoints(center, distance = 2) {
  const R = 6371; // Earth's radius in km
  const points = [];
  const numPoints = 6; // Number of points in the route

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