import Groq from "groq-sdk";

const analyzeTicket = async (ticket) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are a technical support ticket analyzer. Analyze the given ticket and respond with ONLY a valid JSON object. No explanation, no markdown, no code fences, no extra text — just raw JSON.

The JSON must have exactly these fields:
- "summary": a short one-line summary of the ticket
- "priority": must be exactly one of these strings: "low", "medium", or "high"
- "helpfulNotes": detailed notes to help the moderator resolve this ticket
- "relatedSkills": an array of technical skills needed to resolve this (e.g. ["React", "Node.js"])

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.description}

Respond with ONLY this JSON structure, nothing else:
{
  "summary": "...",
  "priority": "low" or "medium" or "high",
  "helpfulNotes": "...",
  "relatedSkills": ["...", "..."]
}`;

  const maxRetries = 3;
  let delay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // free + powerful
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const raw = completion.choices[0]?.message?.content?.trim();
      console.log("🤖 Groq raw response:", raw);

      try {
        const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const jsonString = match ? match[1].trim() : raw;

        const parsed = JSON.parse(jsonString);

        const response = {
          summary: parsed.summary || "No summary provided",
          priority: ["low", "medium", "high"].includes(parsed.priority)
            ? parsed.priority
            : "medium",
          helpfulNotes: parsed.helpfulNotes || "No notes provided",
          relatedSkills: Array.isArray(parsed.relatedSkills)
            ? parsed.relatedSkills
            : [],
        };

        console.log("✅ Parsed AI Response:", response);
        return response;

      } catch (e) {
        console.log("❌ JSON parse failed: " + e.message);
        return null;
      }

    } catch (err) {
      const isRateLimit = err?.status === 429;

      if (isRateLimit && attempt < maxRetries) {
        console.log(`⚠️ Rate limit! Attempt ${attempt}/${maxRetries}. ${delay / 1000}s baad retry...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        console.log(`❌ Groq error: ${err.message}`);
        return null;
      }
    }
  }

  return null;
};

export default analyzeTicket;