import fs from 'fs';
import path from 'path';

const envContent = `# OpenAI API Key (Required for song recommendations)
# Get your key from: https://platform.openai.com/api-keys
OPEN_API_KEY=your_openai_api_key_here

# Genius Lyrics API Token (Required for fetching lyrics)
# Get your token from: https://genius.com/api-clients
GENIUS_ACCESS_TOKEN=your_genius_access_token_here

# Server Port (Optional, defaults to 4000)
PORT=4000
`;

const envPath = path.join(process.cwd(), '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📝 Please edit the .env file and add your actual API keys:');
  console.log('   1. Get OpenAI API key from: https://platform.openai.com/api-keys');
  console.log('   2. Get Genius token from: https://genius.com/api-clients');
  console.log('   3. Replace the placeholder values in .env file');
  console.log('   4. Run: npm run server');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
} 