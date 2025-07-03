import { useEffect, useState } from 'react';
import getCurrentPlaying from './getPlayback.js';
import { loginWithSpotify } from './spotify.js';
import getLyrics from './fetchLyrics.js'
import fetchSimilarSongs from './getSimilarSongs.js';

function Dashboard() {
  const [currentSong, setCurrentSong] = useState(null);
  const accessToken = localStorage.getItem('access_token');
  const [lyrics,setLyrics]=useState(null)

  useEffect(() => {
    if (!accessToken) {
        loginWithSpotify();
        return;
    };

    getCurrentPlaying(accessToken)
      .then(song => setCurrentSong(song))
      .catch(err => {
        console.error('error', err);
        if (err.message.includes("401")) {
          localStorage.removeItem('access_token');
          window.location.href = '/';
        }
      });
  }, [accessToken]);

  const handleGetLyrics=async()=>{
    if (!currentSong) return;
    const artist=currentSong.item.artists[0].name;
    const title=currentSong.item.name;
    try{
      const fetchedLyrics=await getLyrics(artist,title);
      setLyrics(fetchedLyrics);
      const similarSongs=await fetchSimilarSongs(fetchedLyrics);
    }catch(err){
      console.error('failed',err)
    }
    
    };
  

  if (!currentSong) return <div>No song is playing right now.</div>;

  return (
    <div>
      <h1>Now Playing:</h1>
      <p>
        {currentSong.item.name} by{' '}
        {currentSong.item.artists.map(a => a.name).join(', ')}
      </p>
      <button onClick={handleGetLyrics}>Find Me Similar Songs</button>
    </div>
    
  );
}

export default Dashboard;
