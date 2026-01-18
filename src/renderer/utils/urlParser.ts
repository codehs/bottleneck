/**
 * Utility to parse URLs from text content (like PR descriptions and comments)
 */

export interface ParsedURL {
  url: string;
  label: string;
}

/**
 * Extract all HTTP(S) URLs from text
 */
export function extractURLsFromText(text: string): ParsedURL[] {
  if (!text) return [];
  
  const urlRegex = /(https?:\/\/[^\s\)]+)/gi;
  const matches = text.match(urlRegex) || [];
  
  // Remove duplicates and clean up URLs
  const uniqueUrls = Array.from(new Set(matches));
  
  return uniqueUrls.map((url) => {
    // Remove trailing punctuation that's likely not part of the URL
    let cleanUrl = url.replace(/[.,;:!?\)]+$/, '');
    
    // Try to extract a human-readable label from the URL
    let label = cleanUrl;
    try {
      const urlObj = new URL(cleanUrl);
      const hostname = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname.split('/').filter(Boolean);
      
      if (path.length > 0) {
        label = `${hostname}/${path.slice(0, 2).join('/')}`;
      } else {
        label = hostname;
      }
    } catch (e) {
      // Keep original URL as label if parsing fails
    }
    
    return { url: cleanUrl, label };
  });
}

/**
 * Extract URLs from PR description and comments
 */
export function extractAllURLsFromPR(
  prBody: string | null,
  comments: Array<{ body: string }> = [],
  reviews: Array<{ body: string }> = []
): ParsedURL[] {
  const allUrls: Map<string, ParsedURL> = new Map();
  
  // Extract from PR body
  if (prBody) {
    extractURLsFromText(prBody).forEach((url) => {
      allUrls.set(url.url.toLowerCase(), url);
    });
  }
  
  // Extract from comments
  comments.forEach((comment) => {
    extractURLsFromText(comment.body).forEach((url) => {
      allUrls.set(url.url.toLowerCase(), url);
    });
  });
  
  // Extract from reviews
  reviews.forEach((review) => {
    extractURLsFromText(review.body).forEach((url) => {
      allUrls.set(url.url.toLowerCase(), url);
    });
  });
  
  return Array.from(allUrls.values());
}
