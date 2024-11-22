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
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert trail designer that creates walking paths based on musical characteristics."
        },
        {
          role: "user",
          content: `Create a walking trail description based on these musical features:
            Tempo: ${audioFeatures.tempo}
            Energy: ${audioFeatures.energy}
            Valence: ${audioFeatures.valence}
            Key: ${audioFeatures.key}
            Mode: ${audioFeatures.mode}
            
            Starting from coordinates: ${location.lat}, ${location.lng}
            
            Provide the response as a JSON object with these properties:
            - description: A textual description of the trail
            - recommendedDistance: Distance in kilometers
            - estimatedDuration: Duration in minutes
            - recommendedPace: Walking pace in km/h
            - waypoints: Array of coordinate pairs [lat, lng] for the route`
        }
      ]
    });

    res.status(200).json(JSON.parse(completion.choices[0].message.content));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate trail' });
  }
}