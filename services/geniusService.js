// services/geniusService.js
import axios from 'axios';

export const geniusApi = axios.create({
  baseURL: 'https://api.genius.com',
  headers: {
    'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN}`
  }
});