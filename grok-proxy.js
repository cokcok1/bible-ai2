// api/grok-proxy.js
// 這是 Vercel Edge Function 的程式碼，用於代理對 Grok API 的請求。
// Edge Function 提供更快的執行速度和更穩定的 CORS 處理。

// 這是啟用 Edge Function 的關鍵配置
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // --- 步驟 1: 處理 CORS 預檢請求 ---
  // 這一段程式碼會處理瀏覽器發出的 OPTIONS 預檢請求
  // 並回傳必要的 CORS 標頭，以允許跨來源請求。
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // --- 步驟 2: 驗證 API 金鑰 ---
  const GROK_KEY = process.env.GROK_API_KEY; 
  if (!GROK_KEY) {
    console.error('❌ Vercel 伺服器錯誤: 缺少 GROK_API_KEY 環境變數。');
    return new Response(JSON.stringify({ error: 'Server configuration error: API key missing.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- 步驟 3: 轉發請求到 Grok API ---
  try {
    const grokResponse = await fetch('https://api.grok.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_KEY}`
      },
      body: JSON.stringify(await request.json())
    });

    // --- 步驟 4: 處理 Grok 的回傳並回傳給前端 ---
    const responseData = await grokResponse.json();
    const headers = {
      'Content-Type': 'application/json',
      // 再次設置 CORS 標頭，確保 POST 請求也能通過
      'Access-Control-Allow-Origin': '*',
    };

    return new Response(JSON.stringify(responseData), {
      status: grokResponse.status,
      headers: headers,
    });

  } catch (error) {
    console.error('❌ 後端代理連線失敗:', error);
    return new Response(JSON.stringify({ error: 'Failed to proxy request.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
