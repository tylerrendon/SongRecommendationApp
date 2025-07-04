import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai'
dotenv.config()

import Genius from "genius-lyrics";
const Client = new Genius.Client(process.env.GENIUS_ACCESS_TOKEN);//hide this !!!!!!!!
const openai=new OpenAI({
  apiKey:process.env.OPEN_API_KEY,
});

const app = express();
app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/get-current-playing',async(req,res)=>{
    const accessToken=req.query.access_token;
    if (!accessToken){
          return res.status(401).json({ error: 'Access token missing, please login' });
    }
    
    // Check if token is valid
    const isTokenValid = await checkSpotifyToken(accessToken);
    if (!isTokenValid) {
      return res.status(401).json({ error: 'Access token expired, please refresh' });
    }
    
    try{
        const spotifyres=await fetch('https://api.spotify.com/v1/me/player/currently-playing',{
            headers:{
                Authorization:`Bearer ${accessToken}`,
            },
            });
            if (spotifyres.status===204){
                return res.sendStatus(204);
            }
               if (!spotifyres.ok) {
          const errorText = await spotifyres.text();
          console.error('Spotify API error:', errorText);
          return res.status(spotifyres.status).json({ error: 'Spotify API error' });
        }
        const data=await spotifyres.json();
        return res.json(data);
    } catch(err){
        console.error("server error",err);
         res.status(500).json({ error: 'Internal server error' });
      }
});
app.get('/get-current-lyrics',async (req,res) => {
    const artist=req.query.artist;
    const title=req.query.title;
      if (!artist || !title) {
    return res.status(400).json({ error: 'Missing artist or title query parameter' });
  }
  const searches=await Client.songs.search(`${artist} ${title}`)
   if (!searches.length) {
    throw new Error('No song found');
  }
  const song = searches[0];
  const lyrics = await song.lyrics();
  


   return res.json({ lyrics })
});



app.get('/search-song', async (req, res) => {
  const { query, access_token } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  if (!access_token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify search API error:', errorText);
      return res.status(response.status).json({ error: 'Spotify API error' });
    }

    const data = await response.json();
    
    if (data.tracks && data.tracks.items.length > 0) {
      const track = data.tracks.items[0];
      const songInfo = {
        name: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        coverArt: track.album.images.length > 0 ? track.album.images[0].url : null,
        spotifyUrl: track.external_urls.spotify,
        previewUrl: track.preview_url
      };
      res.json(songInfo);
    } else {
      res.status(404).json({ error: 'Song not found' });
    }
  } catch (error) {
    console.error('Error searching for song:', error);
    res.status(500).json({ error: 'Failed to search for song' });
  }
});

app.post('/get-similar-songs-with-art', async (req, res) => {
  try {
    const { lyrics, access_token } = req.body;
    console.log('Received request for similar songs');
    console.log('Lyrics length:', lyrics ? lyrics.length : 0);
    console.log('Access token present:', !!access_token);
    
    if (!lyrics) {
      console.log('Error: No lyrics provided');
      return res.status(400).json({ error: "Lyrics are required" });
    }
    if (!access_token) {
      console.log('Error: No access token provided');
      return res.status(401).json({ error: "Access token is required" });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPEN_API_KEY) {
      console.error('Error: OPEN_API_KEY not found in environment variables');
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    console.log('OpenAI API key configured:', !!process.env.OPEN_API_KEY);

    const prompt = `You are a professional music recommender trained to deeply analyze lyrics beyond surface-level genre tags. Your goal is to recommend EXACTLY 3 songs that closely match the emotional message, storytelling, and vibe of the input song, while staying strictly within the same or closely related genres (e.g., R&B, alt-R&B, neo-soul).

In your recommendations, consider:

- Lyrical meaning and narrative (themes like betrayal, desire, detachment, self-worth, etc.)
- Mood and delivery (tone of voice, emotional weight, vulnerability, etc.)
- Musical flow (tempo, instrumentation, overall vibe)
- Genre fidelity — only suggest songs that stylistically align with the original artist (e.g., if the original song is by Brent Faiyaz, do not suggest genres like pop-country even if the lyrical meaning is the same)

You may use external lyric sources to understand the meaning better, but prioritize authentic, emotionally and sonically relevant matches.

IMPORTANT: Return EXACTLY 3 songs in this format:
1. Song Title by Artist Name
2. Song Title by Artist Name  
3. Song Title by Artist Name

Here are the lyrics to analyze:

${lyrics}`;

    console.log('Sending request to OpenAI...');
    console.log('Prompt length:', prompt.length);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    });

    console.log('OpenAI response received');
    console.log('Response object:', JSON.stringify(completion, null, 2));

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Invalid OpenAI response structure:', completion);
      return res.status(500).json({ error: "Invalid response from OpenAI" });
    }

    const similarSongsText = completion.choices[0].message.content.trim();
    console.log('Raw LLM response:', similarSongsText);
    
    // Parse and clean the songs, ensuring we get exactly 3
    let similarSongs = similarSongsText
      .split('\n')
      .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(s => s.length > 0 && s !== '');
    
    // Ensure we only get exactly 3 songs
    similarSongs = similarSongs.slice(0, 3);
    
    // If we got fewer than 3 songs, add placeholder songs
    while (similarSongs.length < 3) {
      similarSongs.push(`Song ${similarSongs.length + 1} (No recommendation available)`);
    }
    
    console.log('Parsed similar songs (limited to 3):', similarSongs);

    // Get cover art for each suggested song
    const songsWithArt = [];
    console.log(`Searching for ${similarSongs.length} songs on Spotify...`);
    
    for (const song of similarSongs) {
      console.log(`Searching for: "${song}"`);
      try {
        const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(song)}&type=track&limit=1`, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        console.log(`Spotify search response status: ${searchResponse.status}`);

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log(`Spotify search results for "${song}":`, searchData.tracks ? searchData.tracks.items.length : 0);
          
          if (searchData.tracks && searchData.tracks.items.length > 0) {
            const track = searchData.tracks.items[0];
            const songInfo = {
              name: track.name,
              artist: track.artists.map(artist => artist.name).join(', '),
              album: track.album.name,
              coverArt: track.album.images.length > 0 ? track.album.images[0].url : null,
              spotifyUrl: track.external_urls.spotify,
              previewUrl: track.preview_url
            };
            console.log(`Found song: ${songInfo.name} by ${songInfo.artist}`);
            songsWithArt.push(songInfo);
          } else {
            // If song not found on Spotify, still include it without art
            console.log(`Song not found on Spotify: "${song}"`);
            songsWithArt.push({
              name: song,
              artist: 'Unknown',
              album: 'Unknown',
              coverArt: null,
              spotifyUrl: null,
              previewUrl: null
            });
          }
        } else {
          console.error(`Spotify search failed for "${song}":`, searchResponse.status, searchResponse.statusText);
          // Include song even if search fails
          songsWithArt.push({
            name: song,
            artist: 'Unknown',
            album: 'Unknown',
            coverArt: null,
            spotifyUrl: null,
            previewUrl: null
          });
        }
      } catch (error) {
        console.error(`Error searching for song "${song}":`, error);
        // Include song even if search fails
        songsWithArt.push({
          name: song,
          artist: 'Unknown',
          album: 'Unknown',
          coverArt: null,
          spotifyUrl: null,
          previewUrl: null
        });
      }
    }

    console.log(`Final result: ${songsWithArt.length} songs with art`);
    console.log('Sending response to client');
    res.json({ similarSongs: songsWithArt });
  } catch (error) {
    console.error('Error in /get-similar-songs-with-art:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to get similar songs with art',
      details: error.message 
    });
  }
});

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = '0fbb5de8f7e24e119fc3693e59f46150';
const SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:3000/';

// Generate PKCE parameters
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => possible[x % possible.length])
    .join('');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

// Helper function to check if Spotify token is valid
const checkSpotifyToken = async (accessToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Spotify OAuth endpoints for Lovable
app.get('/spotify-auth', async (req, res) => {
  try {
    const { action, user_id } = req.query;
    
    if (action !== 'login') {
      return res.status(400).json({ error: 'Invalid action. Use "login"' });
    }
    
    // Generate PKCE parameters
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);
    
    // Store code verifier (in production, store this in a database with user_id)
    // For now, we'll store it in memory (not recommended for production)
    global.codeVerifiers = global.codeVerifiers || {};
    global.codeVerifiers[user_id] = codeVerifier;
    
    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email user-read-currently-playing',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });
    
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

app.get('/refresh-token', async (req, res) => {
  try {
    const { refresh_token } = req.query;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    const url = "https://accounts.spotify.com/api/token";
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    };
    
    const response = await fetch(url, payload);
    const data = await response.json();
    
    if (data.error) {
      console.error('Spotify refresh token error:', data);
      return res.status(400).json({ 
        error: 'Failed to refresh token',
        details: data.error_description || data.error
      });
    }
    
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh_token, // Spotify may not return new refresh token
      expires_in: data.expires_in
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: [
      '/get-current-playing',
      '/get-current-lyrics', 
      '/search-song',
      '/get-similar-songs-with-art',
      '/spotify-auth',
      '/refresh-token'
    ],
    env: {
      openai_configured: !!process.env.OPEN_API_KEY,
      genius_configured: !!process.env.GENIUS_ACCESS_TOKEN,
      port: process.env.PORT || 4000
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});




