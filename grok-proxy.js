// api/grok-proxy.js
// 這是 Vercel Serverless Function 的程式碼，用於代理對 Grok API 的請求。
// 它可以解決 CORS 問題，並保護你的 API 金鑰。

import fetch from 'node-fetch';

export default async function handler(req, res) {
  // --- 步驟 1: 設置 CORS 標頭 ---
  // 這一步是解決你瀏覽器錯誤的關鍵。它允許來自任何網域的請求。
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 處理瀏覽器發出的 OPTIONS 預檢請求 (Preflight Request)。
  // 如果沒有這一段，瀏覽器會因為 CORS 預檢失敗而直接阻擋 POST 請求。
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 確保請求是 POST 方法
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // --- 步驟 2: 驗證 API 金鑰 ---
  // 從 Vercel 環境變數中獲取 Grok API 金鑰。
  // 如果沒有設定，函式會回傳 500 錯誤。
  const GROK_KEY = process.env.GROK_API_KEY; 
  if (!GROK_KEY) {
    console.error('❌ Vercel 伺服器錯誤: 缺少 GROK_API_KEY 環境變數。');
    res.status(500).json({ error: 'Server configuration error: API key missing.' });
    return;
  }
  
  // --- 步驟 3: 轉發請求到 Grok API ---
  try {
    const grokResponse = await fetch('https://api.grok.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_KEY}` // 使用後端金鑰
      },
      body: JSON.stringify(req.body)
    });

    // --- 步驟 4: 處理 Grok 的回傳 ---
    // 如果 Grok API 回傳錯誤，我們會將錯誤回傳給前端。
    if (!grokResponse.ok) {
      const errorData = await grokResponse.json();
      console.error('Grok API 回傳錯誤:', grokResponse.status, errorData);
      res.status(grokResponse.status).json(errorData);
      return;
    }

    // 如果 Grok 成功回傳，我們會將其結果轉發給前端。
    const data = await grokResponse.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ 後端代理連線失敗:', error);
    res.status(500).json({ error: 'Failed to proxy request.' });
  }
}
