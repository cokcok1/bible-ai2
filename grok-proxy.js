import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 設置 CORS 標頭以允許來自任何網域的請求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 處理 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 檢查是否為 POST 請求
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 從環境變數中獲取 Grok API 金鑰
  const GROK_KEY = process.env.GROK_API_KEY; 
  if (!GROK_KEY) {
    res.status(500).json({ error: 'Server configuration error: API key missing.' });
    return;
  }
  
  // 轉發請求到 Grok API
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
