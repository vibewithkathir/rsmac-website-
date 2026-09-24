export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Handle AI API proxy
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const apiKey = env.GROQ_API_KEY;

        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        // Groq model fallback chain (verified working with this API key)
        const models = [
          "openai/gpt-oss-120b",
          "openai/gpt-oss-20b",
          "qwen/qwen3.8-27b",
        ];

        let lastError = null;
        for (const model of models) {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: body.messages,
              max_tokens: 512,
              temperature: 0.2,
            }),
          });

          const data = await response.json();

          // If rate limited (429) try next model
          if (response.status === 429 || (data.error && data.error.code === 429)) {
            lastError = data.error || { message: "Rate limited" };
            continue;
          }

          // Other upstream error
          if (!response.ok || data.error) {
            const statusCode = response.status;
            return new Response(JSON.stringify({ error: `API_ERROR_${statusCode}` }), {
              status: 500,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }

          // Success!
          return new Response(JSON.stringify(data), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }

        // All models exhausted
        return new Response(JSON.stringify({ error: "API_ALL_MODELS_BUSY" }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    // For all other routes, serve static assets
    return env.ASSETS.fetch(request);
  },
};
