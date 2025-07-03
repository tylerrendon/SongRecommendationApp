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

app.post('/get-similar-songs',async (req,res) => {
  try{
  const {lyrics}=req.body;
  if (!lyrics){
    return res.status(400).json({error:"error getting similar songs"})
  }
   const prompt=`You are a professional music recommender trained to deeply analyze lyrics beyond surface-level genre tags. Your goal is to recommend exactly 4 songs that closely match the emotional message, storytelling, and vibe of the input song, while staying strictly within the same or closely related genres (e.g., R&B, alt-R&B, neo-soul).

In your recommendations, consider:

- Lyrical meaning and narrative (themes like betrayal, desire, detachment, self-worth, etc.)
- Mood and delivery (tone of voice, emotional weight, vulnerability, etc.)
- Musical flow (tempo, instrumentation, overall vibe)
- Genre fidelity — only suggest songs that stylistically align with the original artist (e.g., if the original song is by Brent Faiyaz, do not suggest genres like pop-country even if the lyrical meaning is the same)

You may use external lyric sources to understand the meaning better, but prioritize authentic, emotionally and sonically relevant matches.

Here are the lyrics and only recommend 3 songs:

${lyrics}`;
   const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    });
     const similarSongsText = completion.choices[0].message.content.trim();

    const similarSongs = similarSongsText.split('\n').map(s => s.replace(/^\d+[\.\)]\s*/, '').trim());
    console.log(similarSongsText)

    res.json({ similarSongs });
     } catch (error) {
    console.error('Error in /get-similar-songs:', error);
    res.status(500).json({ error: 'Failed to get similar songs' });
  }

})






app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});




