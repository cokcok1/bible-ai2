// Cloudflare Worker 程式碼
// 這段程式碼會將前端請求代理到 Grok API，並處理 CORS。

// 處理所有傳入的請求
export default {
  async fetch(request, env) {
    // 處理 CORS 預檢請求 (OPTIONS request)
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // 處理實際的 POST 請求
    return handlePost(request, env);
  },
};

// 處理 OPTIONS 預檢請求
async function handleOptions(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 瀏覽器可以快取此預檢請求 24 小時
  };

  return new Response(null, {
    status: 204, // No Content
    headers: headers,
  });
}

// 處理 POST 請求並代理到 Grok API
async function handlePost(request, env) {
  const GROK_KEY = env.GROK_API_KEY;

  if (!GROK_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error: API key missing.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const grokResponse = await fetch('https://api.grok.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_KEY}`
      },
      body: JSON.stringify(await request.json())
    });

    const responseData = await grokResponse.json();
    
    // 建立新的回應，並加上 CORS 標頭
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    return new Response(JSON.stringify(responseData), {
      status: grokResponse.status,
      headers: headers,
    });
  } catch (error) {
    console.error('後端代理連線失敗:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy request.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
