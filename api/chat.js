// Groq model fallback chain
const MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
];

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Missing GROQ_API_KEY in environment variables" });
    }

    const body = req.body || {};
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid or missing messages array" });
    }

    let lastError = null;

    for (const model of MODELS) {
        try {
            const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages,
                    max_tokens: 512,
                    temperature: 0.2,
                }),
            });

            const data = await upstream.json();

            // Rate-limited — try next model
            if (upstream.status === 429 || (data.error && data.error.code === 429)) {
                lastError = data.error || { message: "Rate limited" };
                console.warn(`[chat] Model ${model} rate-limited, trying next...`);
                continue;
            }

            // Other upstream error
            if (!upstream.ok || data.error) {
                console.error(`[chat] Model ${model} error:`, data.error);
                return res.status(500).json({ error: `API_ERROR_${upstream.status}` });
            }

            // Success
            return res.status(200).json(data);

        } catch (err) {
            console.error(`[chat] Fetch error for model ${model}:`, err.message);
            lastError = err;
        }
    }

    console.error("[chat] All models failed or rate-limited.");
    return res.status(429).json({ error: "API_ALL_MODELS_BUSY" });
};
