import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { track, accessToken } = req.body; // Get these from the request

    // Double check the token is valid before making the request
    const featuresUrl = `https://api.spotify.com/v1/audio-features/${track.id}`;
    console.log('Requesting audio features:', {
      trackId: track.id,
      url: featuresUrl,
      hasToken: !!accessToken
    });

    const featuresResponse = await axios.get(featuresUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Verify we got a valid response
    if (!featuresResponse.data) {
      throw new Error('Empty response from audio features endpoint');
    }

    console.log('Audio features received:', {
      hasData: !!featuresResponse.data,
      trackId: track.id
    });

    // Send successful response
    res.status(200).json(featuresResponse.data);

  } catch (error) {
    console.error('Error fetching audio features:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data?.error,
      trackId: req.body?.track?.id
    });
    
    // Send error response
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data?.error
    });
  }
}