let featuresResponse;
try {
  // Double check the token is valid before making the request
  const featuresUrl = `https://api.spotify.com/v1/audio-features/${track.id}`;
  console.log('Requesting audio features:', {
    trackId: track.id,
    url: featuresUrl,
    hasToken: !!accessToken
  });

  featuresResponse = await axios.get(featuresUrl, {
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
} catch (error) {
  console.error('Error fetching audio features:', {
    status: error.response?.status,
    statusText: error.response?.statusText,
    error: error.response?.data?.error,
    trackId: track.id
  });
  throw error;
}