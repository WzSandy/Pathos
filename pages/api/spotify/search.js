import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchQuery } = req.body;

  try {
    // First, get access token
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

    // Then search for the track
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
    
    // Get audio features for the track
    const featuresResponse = await axios.get(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    res.status(200).json({
      track: track,
      audioFeatures: featuresResponse.data
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch song data' });
  }
}