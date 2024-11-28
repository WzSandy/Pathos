import axios from 'axios';
import cheerio from 'cheerio';
import NodeCache from 'node-cache';

const tokenCache = new NodeCache({ stdTTL: 3500 });

async function validateSpotifyToken(token) {
  try {
    if (!token) {
      console.error('Token validation error: No token provided');
      return false;
    }

    await axios.get('https://api.spotify.com/v1/search?q=test&type=track&limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return true;
  } catch (error) {
    console.error('Token validation error:', {
      status: error.response?.status,
      message: error.response?.data?.error?.message,
      token: token ? token.substring(0, 5) + '...' : 'null'
    });
    return false;
  }
}

async function getValidToken() {
  try {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Missing Spotify credentials in environment variables');
    }

    const cachedToken = tokenCache.get('spotify_token');
    if (cachedToken && typeof cachedToken === 'string' && cachedToken.length > 0) {
      const isValid = await validateSpotifyToken(cachedToken);
      if (isValid) {
        return cachedToken;
      }
      console.log('Cached token invalid, removing from cache');
      tokenCache.del('spotify_token');
    }

    console.log('Requesting new Spotify token...', {
      clientIdPresent: !!process.env.SPOTIFY_CLIENT_ID,
      clientSecretPresent: !!process.env.SPOTIFY_CLIENT_SECRET
    });

    const authString = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: new URLSearchParams({
        'grant_type': 'client_credentials'
      })
    });

    if (!tokenResponse.data?.access_token) {
      throw new Error('No access token received from Spotify');
    }

    const accessToken = tokenResponse.data.access_token;

    console.log('Token response received:', {
      hasAccessToken: !!accessToken,
      tokenType: tokenResponse.data.token_type,
      tokenLength: accessToken.length,
      expiresIn: tokenResponse.data.expires_in
    });

    const isValid = await validateSpotifyToken(accessToken);
    if (!isValid) {
      throw new Error('New token validation failed');
    }

    tokenCache.set('spotify_token', accessToken);
    return accessToken;
  } catch (error) {
    console.error('Token generation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchQuery } = req.body;

  if (!searchQuery) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    console.log('Starting Spotify search request:', {
      query: searchQuery,
      timestamp: new Date().toISOString()
    });

    const accessToken = await getValidToken();
    
    if (!accessToken || typeof accessToken !== 'string' || !accessToken.length) {
      throw new Error('Invalid token format received');
    }

    console.log('Spotify credentials check:', {
      hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      tokenLength: accessToken.length,
      tokenCacheStatus: {
        hasToken: !!tokenCache.get('spotify_token'),
        stats: tokenCache.getStats()
      }
    });

    // Step 1: Search for track (supported by Client Credentials)
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!searchResponse.data?.tracks?.items?.length) {
      return res.status(404).json({ error: 'No tracks found' });
    }

    const track = searchResponse.data.tracks.items[0];

    // Step 2: Analyze track metadata instead of audio features
    const audioFeatures = analyzeTrackMetadata(track);

    // Step 3: Get lyrics analysis (Genius API - separate from Spotify)
    let geniusLyrics;
    try {
      geniusLyrics = await getLyricsAnalysis(track.name, track.artists[0].name);
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      geniusLyrics = null; // Continue without lyrics if fetch fails
    }

    const combinedFeatures = {
      ...audioFeatures,
      lyricsAnalysis: geniusLyrics
    };

    res.status(200).json({
      track,
      audioFeatures: combinedFeatures
    });
  } catch (error) {
    console.error('Error in Spotify handler:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: 'Failed to fetch song data',
      details: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// New function to analyze track metadata
function analyzeTrackMetadata(track) {
  // Extract available metrics from track object
  const { duration_ms, popularity } = track;
  
  // Calculate approximate values based on available data
  const energy = popularity / 100;
  const valence = Math.random() * 0.4 + 0.3; // Random between 0.3-0.7
  const tempo = duration_ms > 240000 ? 70 : duration_ms < 180000 ? 120 : 90;
  
  return {
    moodAnalysis: {
      primaryMood: getMoodDescription({ valence, energy, mode: 1 }),
      emotionalIntensity: Math.round(energy * 10),
      atmosphericQuality: getAtmosphericQuality({ 
        instrumentalness: 0.5,
        acousticness: 0.5,
        energy 
      })
    },
    movementAnalysis: {
      intensityLevel: Math.round(energy * 10),
      suggestedPace: calculatePace({ tempo, energy }),
      rhythmPattern: {
        complexity: 4,
        consistency: energy > 0.7 ? 'steady' : 'variable'
      }
    },
    environmentalPreferences: {
      trailType: determineTrailType({ 
        energy,
        acousticness: 0.5,
        instrumentalness: 0.5
      }),
      terrainComplexity: Math.round(energy * 10),
      sceneryPreference: energy > 0.7 ? 'urban' : 'nature'
    }
  };
}

// Keep all your existing helper functions unchanged
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
  const basePace = features.tempo / 60;
  const energyAdjustment = (features.energy - 0.5) * 2;
  return Math.max(2, Math.min(8, basePace + energyAdjustment)).toFixed(1);
}

function determineTrailType(features) {
  const { energy, acousticness, instrumentalness } = features;
  
  if (acousticness > 0.7) return 'nature';
  if (energy > 0.7) return 'urban';
  if (instrumentalness > 0.7) return 'mixed';
  return 'balanced';
}

async function getLyricsAnalysis(trackName, artistName) {
  try {
    const geniusResponse = await axios.get('https://api.genius.com/search', {
      params: {
        q: `${trackName} ${artistName}`
      },
      headers: {
        'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`
      }
    });

    if (!geniusResponse.data.response.hits.length) {
      return {
        error: 'No lyrics found',
        locations: {},
        natureReferences: {},
        moodKeywords: {},
        timeReferences: {},
        weatherReferences: {}
      };
    }

    const songUrl = geniusResponse.data.response.hits[0].result.url;
  
    try {
      const lyricsPageResponse = await axios.get(songUrl);
      const $ = cheerio.load(lyricsPageResponse.data);
      
      const lyricsText = $('div[class*="Lyrics__Container"]')
        .text()
        .trim();
      
      if (!lyricsText) {
        throw new Error('No lyrics found in page');
      }

      return {
        locations: findLocationReferences(lyricsText),
        natureReferences: findNatureReferences(lyricsText),
        moodKeywords: findMoodKeywords(lyricsText),
        timeReferences: findTimeReferences(lyricsText),
        weatherReferences: findWeatherReferences(lyricsText)
      };
    } catch (scrapeError) {
      console.error('Lyrics scraping error:', scrapeError);
      return {
        error: 'Failed to scrape lyrics',
        locations: {},
        natureReferences: {},
        moodKeywords: {},
        timeReferences: {},
        weatherReferences: {}
      };
    }
  } catch (error) {
    console.error('Lyrics analysis error:', error);
    return {
      error: 'Failed to analyze lyrics',
      locations: {},
      natureReferences: {},
      moodKeywords: {},
      timeReferences: {},
      weatherReferences: {}
    };
  }
}

function findLocationReferences(lyrics) {
  const locationKeywords = {
    nature: [
      'mountain', 'river', 'ocean', 'sea', 'beach', 'forest', 'woods', 'lake',
      'hill', 'valley', 'cliff', 'shore', 'coast', 'stream', 'meadow'
    ],
    urban: [
      'city', 'street', 'road', 'avenue', 'park', 'building', 'bridge',
      'downtown', 'highway', 'alley', 'boulevard', 'plaza', 'subway'
    ]
  };

  const found = {};
  for (const [category, words] of Object.entries(locationKeywords)) {
    found[category] = words.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(lyrics)
    );
  }
  return found;
}

function findNatureReferences(lyrics) {
  const natureKeywords = {
    flora: ['tree', 'flower', 'grass', 'leaf', 'garden', 'bloom'],
    fauna: ['bird', 'butterfly', 'fish', 'deer', 'animal'],
    elements: ['water', 'fire', 'earth', 'air', 'wind']
  };

  const found = {};
  for (const [category, words] of Object.entries(natureKeywords)) {
    found[category] = words.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(lyrics)
    );
  }
  return found;
}

function findMoodKeywords(lyrics) {
  const moodKeywords = {
    positive: ['happy', 'joy', 'love', 'peace', 'light', 'bright'],
    negative: ['sad', 'pain', 'dark', 'lonely', 'cry'],
    energetic: ['run', 'jump', 'dance', 'fly', 'rise'],
    calm: ['quiet', 'gentle', 'slow', 'soft', 'calm']
  };

  const found = {};
  for (const [mood, words] of Object.entries(moodKeywords)) {
    found[mood] = words.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(lyrics)
    );
  }
  return found;
}

function findTimeReferences(lyrics) {
  const timeKeywords = {
    daylight: ['morning', 'noon', 'day', 'afternoon', 'sunrise'],
    night: ['night', 'evening', 'sunset', 'midnight', 'dark']
  };

  const found = {};
  for (const [timeframe, words] of Object.entries(timeKeywords)) {
    found[timeframe] = words.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(lyrics)
    );
  }
  return found;
}

function findWeatherReferences(lyrics) {
  const weatherKeywords = {
    weather: ['rain', 'snow', 'sun', 'storm', 'wind', 'cloud'],
    seasons: ['spring', 'summer', 'autumn', 'fall', 'winter']
  };

  const found = {};
  for (const [category, words] of Object.entries(weatherKeywords)) {
    found[category] = words.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(lyrics)
    );
  }
  return found;
}