
 const getCurrentPlaying=async(accessToken)=>{
   const res = await fetch(`http://localhost:4000/get-current-playing?access_token=${accessToken}`)
  
    
    if (res.status===204){
        return null
    }
    if (!res.ok){
        const errorText = await res.text();
        console.error('Spotify API error response:', errorText);
        throw new Error("Error fetching current song");
    }
    return await res.json();
};
export default getCurrentPlaying;