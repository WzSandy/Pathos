import wiki from 'wikijs';
import NodeCache from 'node-cache';

// Enhanced cache configuration with separate TTLs for different content types
const wikiCache = new NodeCache({
  stdTTL: 86400, // 24 hours default TTL
  checkperiod: 3600, // Check for expired entries every hour
  useClones: false, // Optimize memory usage
  maxKeys: 1000 // Prevent unlimited cache growth
});

// Supported languages configuration
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ko'];
const DEFAULT_LANGUAGE = 'en';

// Enhanced relevance verification with language-specific adjustments
function verifyRelevance(searchTerm, content, location, language = DEFAULT_LANGUAGE) {
  try {
    const searchTerms = searchTerm.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    const locationTerms = location.toLowerCase().split(' ');

    // Language-specific location keywords
    const locationKeywords = {
      en: ['located', 'situated', 'found in', 'based in'],
      es: ['ubicado', 'situado', 'encontrado en', 'basado en'],
      fr: ['situé', 'localisé', 'trouvé à', 'basé à'],
      de: ['befindet', 'gelegen', 'gefunden in', 'basiert in'],
      // Add more languages as needed
    };

    const currentKeywords = locationKeywords[language] || locationKeywords[DEFAULT_LANGUAGE];

    // Enhanced place name check with length and frequency analysis
    const hasPlaceName = searchTerms.some(term => 
      term.length > 3 && 
      (contentLower.includes(term) || 
       contentLower.match(new RegExp(term, 'g'))?.length > 1)
    );

    // Enhanced location reference check
    const hasLocation = locationTerms.some(term => 
      term.length > 3 && 
      (contentLower.includes(term) || 
       contentLower.match(new RegExp(term, 'g'))?.length > 1)
    );

    // Enhanced context check with language support
    const hasLocationContext = currentKeywords.some(keyword =>
      contentLower.includes(keyword)
    );

    // Calculate relevance score
    const relevanceScore = [hasPlaceName, hasLocation, hasLocationContext]
      .filter(Boolean).length;

    return {
      isRelevant: relevanceScore >= 2,
      score: relevanceScore
    };
  } catch (error) {
    console.error('Error in verifyRelevance:', error);
    return { isRelevant: false, score: 0 };
  }
}

// Enhanced information extraction with better handling of different content types
function extractRelevantInfo(summary, language = DEFAULT_LANGUAGE) {
  try {
    // Remove citations and references
    const cleanSummary = summary.replace(/\[\d+\]/g, '');

    // Language-specific sentence splitting
    const sentenceSplitRegex = {
      en: /[.!?](?=\s|$)/,
      ja: /[。！？]/,
      zh: /[。！？]/,
      default: /[.!?](?=\s|$)/
    };

    const splitRegex = sentenceSplitRegex[language] || sentenceSplitRegex.default;
    const sentences = cleanSummary.split(splitRegex).filter(s => s.trim());

    // Language-specific priority keywords
    const priorityKeywords = {
      en: ['historic', 'founded', 'built', 'established', 'designed', 'famous'],
      es: ['histórico', 'fundado', 'construido', 'establecido', 'diseñado', 'famoso'],
      fr: ['historique', 'fondé', 'construit', 'établi', 'conçu', 'célèbre'],
      // Add more languages as needed
      default: ['historic', 'founded', 'built', 'established', 'designed', 'famous']
    };

    const currentKeywords = priorityKeywords[language] || priorityKeywords.default;

    // Enhanced sentence scoring with language support
    const scoredSentences = sentences.map(sentence => ({
      text: sentence,
      score: currentKeywords.reduce((score, keyword) =>
        score + (sentence.toLowerCase().includes(keyword) ? 1 : 0), 0)
    }));

    // Sort and select best sentences
    const bestSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(s => s.text);

    return bestSentences.join('. ') + (language === 'ja' || language === 'zh' ? '。' : '.');
  } catch (error) {
    console.error('Error in extractRelevantInfo:', error);
    return summary.slice(0, 200) + '...'; // Fallback to truncated summary
  }
}

// Main Wikipedia information retrieval function with enhanced error handling and retry logic
export async function getWikiInformation(placeName, vicinity, language = DEFAULT_LANGUAGE) {
  // Validate inputs
  if (!placeName || !vicinity) {
    console.warn('Missing required parameters for Wikipedia search');
    return null;
  }

  // Normalize language code and validate
  const normalizedLang = language.toLowerCase().slice(0, 2);
  const selectedLang = SUPPORTED_LANGUAGES.includes(normalizedLang) ? normalizedLang : DEFAULT_LANGUAGE;

  // Generate cache key
  const cacheKey = `wiki_${selectedLang}_${placeName}_${vicinity}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 100);

  // Check cache
  const cachedData = wikiCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Retry configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Initialize Wikipedia client with language
      const wikiClient = wiki({ apiUrl: `https://${selectedLang}.wikipedia.org/w/api.php` });

      // Perform search with timeout
      const searchPromise = wikiClient.search(`${placeName} ${vicinity}`, 3);
      const searchResults = await Promise.race([
        searchPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Search timeout')), 5000)
        )
      ]);

      if (!searchResults?.results?.length) {
        console.warn(`No Wikipedia results found for ${placeName} in ${selectedLang}`);
        return null;
      }

      // Try each result with relevance checking
      for (const result of searchResults.results) {
        try {
          const page = await wikiClient.page(result);
          const [summary, info] = await Promise.all([
            page.summary(),
            page.info().catch(() => ({})) // Make info optional
          ]);

          const relevanceCheck = verifyRelevance(placeName, summary, vicinity, selectedLang);
          
          if (relevanceCheck.isRelevant) {
            const wikiData = {
              summary: extractRelevantInfo(summary, selectedLang),
              info: info,
              url: page.url(),
              language: selectedLang,
              relevanceScore: relevanceCheck.score
            };

            // Cache successful result
            wikiCache.set(cacheKey, wikiData);
            return wikiData;
          }
        } catch (pageError) {
          console.error(`Error processing Wikipedia page ${result}:`, pageError);
          continue;
        }
      }

      return null;

    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error(`Final attempt failed for ${placeName}:`, error);
        return null;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      console.warn(`Retrying Wikipedia search for ${placeName}, attempt ${attempt + 1}`);
    }
  }

  return null;
}

// Export additional utility functions for testing and monitoring
export const utils = {
  verifyRelevance,
  extractRelevantInfo,
  clearCache: () => wikiCache.flushAll(),
  getCacheStats: () => ({
    keys: wikiCache.keys().length,
    hits: wikiCache.getStats().hits,
    misses: wikiCache.getStats().misses
  })
};