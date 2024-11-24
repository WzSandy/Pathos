// Test endpoint at pages/api/test-lyrics.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const response = await axios.post('/api/analyze-lyrics', {
        trackName: "Bohemian Rhapsody",
        artistName: "Queen"
      });
      
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Test failed:', error);
      res.status(500).json({ error: 'Test failed', details: error.message });
    }
  }