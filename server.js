const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API_KEY = process.env.GROQ_API_KEY;

// Groq model fallback chain (verified working with this API key)
const MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
];

app.post('/api/chat', async (req, res) => {
    if (!API_KEY) {
        return res.status(500).json({ error: "Missing GROQ_API_KEY in .env" });
    }

    let lastError = null;

    for (const model of MODELS) {
        try {
            const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages: req.body.messages,
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
            console.log(`[chat] Responded using model: ${model}`);
            return res.json(data);

        } catch (err) {
            console.error(`[chat] Fetch error for model ${model}:`, err.message);
            lastError = err;
        }
    }

    // All models exhausted
    console.error("[chat] All models failed or rate-limited.");
    return res.status(429).json({ error: "API_ALL_MODELS_BUSY" });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🔑 Groq key loaded: ${API_KEY ? '...'+API_KEY.slice(-6) : 'MISSING'}`);
});
