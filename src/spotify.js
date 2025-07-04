// spotifyLogin.js
export const loginWithSpotify = async () => {
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
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

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const clientId = '0fbb5de8f7e24e119fc3693e59f46150';
  const scope = 'user-read-private user-read-email user-read-currently-playing';

  localStorage.setItem('code_verifier', codeVerifier);


  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUrl,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  window.location.href = authUrl;




};
