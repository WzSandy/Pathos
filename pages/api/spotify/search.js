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
      moodDescription: featuresResponse.data.valence > 0.5 ? 'positive' : 'contemplative',
      intensityLevel: Math.round(featuresResponse.data.energy * 10),
      suggestedPace: (featuresResponse.data.tempo / 60).toFixed(1) // Convert BPM to km/h
    };

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