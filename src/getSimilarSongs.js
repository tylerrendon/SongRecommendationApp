import { getValidAccessToken } from './spotifyToken.js';

const fetchSimilarSongsWithArt = async (lyrics) => {
  try {
    const accessToken = await getValidAccessToken();
    
    const res = await fetch('http://localhost:4000/get-similar-songs-with-art', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lyrics, access_token: accessToken }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to fetch similar songs with art');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching similar songs:', error);
    
    // If token refresh failed, redirect to login
    if (error.message.includes('login again') || error.message.includes('No access token')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      window.location.href = '/';
      return null;
    }
    
    throw error;
  }
};

const searchSong = async (query) => {
  try {
    const accessToken = await getValidAccessToken();
    
    const res = await fetch(`http://localhost:4000/search-song?query=${encodeURIComponent(query)}&access_token=${accessToken}`);
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to search for song');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error searching for song:', error);
    
    // If token refresh failed, redirect to login
    if (error.message.includes('login again') || error.message.includes('No access token')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      window.location.href = '/';
      return null;
    }
    
    throw error;
  }
};

export { fetchSimilarSongsWithArt, searchSong };
export default fetchSimilarSongsWithArt;