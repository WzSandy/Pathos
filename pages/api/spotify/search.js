import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchQuery } = req.body;

  if (!searchQuery) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Get access token
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        'grant_type': 'client_credentials'
      }), {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Search for track
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (searchResponse.data.tracks.items.length === 0) {
      return res.status(404).json({ error: 'No tracks found' });
    }

    const track = searchResponse.data.tracks.items[0];

    // Get audio features
    const featuresResponse = await axios.get(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    // Add some interpretation of the audio features
    const audioFeatures = {
      ...featuresResponse.data,
      moodAnalysis: {
        primaryMood: getMoodDescription(featuresResponse.data),
        emotionalIntensity: Math.round(featuresResponse.data.valence * 10),
        atmosphericQuality: getAtmosphericQuality(featuresResponse.data)
      },
      
      // Enhanced movement analysis (incorporating your existing intensityLevel and suggestedPace)
      movementAnalysis: {
        intensityLevel: Math.round(featuresResponse.data.energy * 10), // Keep your existing intensity calculation
        suggestedPace: calculatePace(featuresResponse.data), // Enhanced version of your existing pace calculation
        rhythmPattern: {
          complexity: featuresResponse.data.time_signature,
          consistency: featuresResponse.data.danceability > 0.7 ? 'steady' : 'variable'
        }
      },
      
      // New environmental analysis
      environmentalPreferences: {
        trailType: determineTrailType(featuresResponse.data),
        terrainComplexity: Math.round((featuresResponse.data.energy * 0.4 + 
                                      featuresResponse.data.danceability * 0.3 + 
                                      featuresResponse.data.valence * 0.3) * 10),
        sceneryPreference: featuresResponse.data.acousticness > 0.7 ? 'nature' : 'urban'
      }
    };
    
    // Helper functions (add these before your endpoint handler)
    function getMoodDescription(features) {
      const { valence, energy, mode } = features;
      
      if (valence > 0.8 && energy > 0.8) return 'euphoric';
      if (valence > 0.6 && energy > 0.6) return 'uplifting';
      if (valence > 0.5 && mode === 1) return 'positive';
      if (valence < 0.3 && energy < 0.3) return 'introspective';
      if (valence < 0.4 && mode === 0) return 'melancholic';
      if (energy > 0.7 && valence < 0.5) return 'intense';
      return 'balanced';
    }
    
    function getAtmosphericQuality(features) {
      const { instrumentalness, acousticness, energy } = features;
      
      if (instrumentalness > 0.7) return 'ethereal';
      if (acousticness > 0.7) return 'organic';
      if (energy > 0.7) return 'dynamic';
      return 'balanced';
    }
    
    function calculatePace(features) {
      const basePace = features.tempo / 60; // Your existing BPM to km/h conversion
      const energyAdjustment = (features.energy - 0.5) * 2; // Adjust pace based on energy
      return Math.max(2, Math.min(8, basePace + energyAdjustment)).toFixed(1);
    }
    
    function determineTrailType(features) {
      const { energy, acousticness, instrumentalness } = features;
      
      if (acousticness > 0.7) return 'nature';
      if (energy > 0.7) return 'urban';
      if (instrumentalness > 0.7) return 'mixed';
      return 'balanced';
    }

    res.status(200).json({
      track,
      audioFeatures
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch song data',
      details: error.response?.data || error.message 
    });
  }
}