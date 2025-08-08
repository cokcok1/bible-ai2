// api/grok-proxy.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Check for the POST method
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Define the Grok API key from environment variables
  // This is the most secure way to handle secrets
  const GROK_KEY = process.env.GROK_API_KEY; 
  if (!GROK_KEY) {
    res.status(500).json({ error: 'Server configuration error: API key missing.' });
    return;
  }
  
  // Forward the request to the Grok API
  try {
    const grokResponse = await fetch('https://api.grok.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    if (!grokResponse.ok) {
      const errorData = await grokResponse.json();
      res.status(grokResponse.status).json(errorData);
      return;
    }

    const data = await grokResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to proxy request.' });
  }
}
