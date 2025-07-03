 const clientId = '0fbb5de8f7e24e119fc3693e59f46150';
  const redirectUrl = 'http://127.0.0.1:3000/';

export const getToken=async (code)=>{
    const codeVerifier=localStorage.getItem('code_verifier')
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

  localStorage.setItem('access_token', response.access_token);
  return response.access_token;
};




