import { getValidAccessToken } from './spotifyToken.js';

const getCurrentPlaying = async () => {
  try {
    const accessToken = await getValidAccessToken();
    
    const response = await fetch(`http://localhost:4000/get-current-playing?access_token=${accessToken}`);
    
    if (response.status === 204) {
      return null; // No song playing
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get current playing');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting current playing:', error);
    
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

export default getCurrentPlaying;