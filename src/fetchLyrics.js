const getLyrics=async (artist,title) => {
const res = await fetch(`http://localhost:4000/get-current-lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);

if (res.status===204){
    return null;
}
 if (!res.ok){
        const errorText = await res.text();
        console.error('Spotify API error response:', errorText);
        throw new Error("Error fetching current song");
    }
    const data = await res.json();
    return data.lyrics; // assuming your backend sends { lyrics: "..." }    return
    



}
export default getLyrics;