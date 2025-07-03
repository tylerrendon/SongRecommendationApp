  import logo from './logo.svg';
  import './App.css';
  import { loginWithSpotify } from './spotify.js';
  import {getToken} from './spotifyToken.js'
  import { useEffect } from 'react';
  import {getCurrentPlaying} from './getPlayback.js'



  function App() {
    const handleLogin=()=>{
      loginWithSpotify();
    }
    useEffect(()=>{
      const params=new URLSearchParams(window.location.search);
      const code=params.get('code');
      if(code){
        getToken(code)
        .then(token=>{
          console.log("token",token);
          window.location.href = "/dashboard";
        })
        .catch(err=>console.error('error getting the token',err))
      }
    },[]);

    return (
      <div className="App">
      <button onClick={handleLogin}>Log in with Spotify</button>
      </div>
    );
  }

  export default App;
