import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    // 從 Vercel 的環境變數中讀取 API 金鑰
    const grokApiKey = process.env.GROK_API_KEY;

    // 這是 Grok API 的假設性端點。
    // 當 Grok API 正式開放後，請將這個 URL 替換為實際的 URL。
    const grokApiEndpoint = "https://api.grok.xai/v1/chat/completions";

    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
    }

    // 檢查金鑰是否已設定
    if (!grokApiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    // 取得網站發送的請求內容
    const requestBody = await request.json();

    // 將請求轉發到 Grok API
    const grokResponse = await fetch(grokApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      return NextResponse.json({ error: `Grok API failed: ${grokResponse.status} - ${errorText}` }, { status: 500 });
    }

    const grokData = await grokResponse.json();
    // 將 Grok 的回應傳回給您的網站
    return NextResponse.json(grokData);

  } catch (error) {
    return NextResponse.json({ error: `Worker Error: ${error.message}` }, { status: 500 });
  }
}
