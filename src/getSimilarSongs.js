

const fetchSimilarSongs=async(lyrics)=>{
    const res=await fetch('http://localhost:4000/get-similar-songs',{
        method:'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics }),
  });

  if (!res.ok) throw new Error('Failed to fetch similar songs');
  return res.json(); 
}
export default fetchSimilarSongs;