import axios from 'axios';
import cheerio from 'cheerio';

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

    // Get lyrics from Genius
    const geniusLyrics = await getLyricsAnalysis(track.name, track.artists[0].name);

    // Your existing audio features analysis
    const audioFeatures = {
      ...featuresResponse.data,
      moodAnalysis: {
        primaryMood: getMoodDescription(featuresResponse.data),
        emotionalIntensity: Math.round(featuresResponse.data.valence * 10),
        atmosphericQuality: getAtmosphericQuality(featuresResponse.data)
      },
      movementAnalysis: {
        intensityLevel: Math.round(featuresResponse.data.energy * 10),
        suggestedPace: calculatePace(featuresResponse.data),
        rhythmPattern: {
          complexity: featuresResponse.data.time_signature,
          consistency: featuresResponse.data.danceability > 0.7 ? 'steady' : 'variable'
        }
      },
      environmentalPreferences: {
        trailType: determineTrailType(featuresResponse.data),
        terrainComplexity: Math.round((featuresResponse.data.energy * 0.4 + 
                                    featuresResponse.data.danceability * 0.3 + 
                                    featuresResponse.data.valence * 0.3) * 10),
        sceneryPreference: featuresResponse.data.acousticness > 0.7 ? 'nature' : 'urban'
      },
      lyricsAnalysis: geniusLyrics
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