 const clientId = '0fbb5de8f7e24e119fc3693e59f46150';
  const redirectUrl = 'http://127.0.0.1:3000/';

export const getToken = async (code) => {
  const codeVerifier = localStorage.getItem('code_verifier')
  console.log('Retrieved codeVerifier:', codeVerifier);
  console.log('Authorization code:', code);
  
  const url = "https://accounts.spotify.com/api/token";
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUrl,
      code_verifier: codeVerifier,
    }),
  }

  const body = await fetch(url, payload);
  const response = await body.json();
  console.log('Token endpoint response:', response);
  
  if (response.error) {
    throw new Error(`Token exchange failed: ${response.error_description || response.error}`);
  }

  // Store both access token and refresh token
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem('refresh_token', response.refresh_token);
  localStorage.setItem('token_expires_at', Date.now() + (response.expires_in * 1000));
  
  return response.access_token;
};

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const url = "https://accounts.spotify.com/api/token";
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  }

  try {
    const body = await fetch(url, payload);
    const response = await body.json();
    
    if (response.error) {
      console.error('Refresh token failed:', response);
      // Clear stored tokens and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      throw new Error('Refresh token expired, please login again');
    }

    // Update stored tokens
    localStorage.setItem('access_token', response.access_token);
    if (response.refresh_token) {
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    localStorage.setItem('token_expires_at', Date.now() + (response.expires_in * 1000));
    
    console.log('Token refreshed successfully');
    return response.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const getValidAccessToken = async () => {
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  
  // If no token exists, redirect to login
  if (!accessToken) {
    throw new Error('No access token found');
  }
  
  // Check if token is expired (with 5 minute buffer)
  const now = Date.now();
  const expiresAtTime = parseInt(expiresAt);
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  if (now >= (expiresAtTime - bufferTime)) {
    console.log('Token expired or expiring soon, refreshing...');
    return await refreshAccessToken();
  }
  
  return accessToken;
};

export const isTokenValid = () => {
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  
  if (!accessToken || !expiresAt) {
    return false;
  }
  
  const now = Date.now();
  const expiresAtTime = parseInt(expiresAt);
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  
  return now < (expiresAtTime - bufferTime);
};




