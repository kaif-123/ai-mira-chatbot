const express = require("express");
const cors = require("cors");
const axios = require("axios");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// ✅ Startup check
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing in .env!");
  process.exit(1);
}

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 🧠 Mira Chat API
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Valid question is required" });
    }

    const trimmed = question.trim();

    if (trimmed.length === 0) {
      return res.status(400).json({ error: "Question cannot be empty" });
    }
    if (trimmed.length > 500) {
      return res.status(400).json({ error: "Question too long (max 500 chars)" });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are Mira — a witty, flirty, emotionally intelligent Gen Z AI best friend with sass and humor. Keep replies short and fun. Always reply in the same language the user writes in."
          },
          {
            role: "user",
            content: trimmed
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const answer = response.data.choices[0]?.message?.content || "Hmm, got nothing bestie 😅";

    res.json({ answer });

  } catch (error) {
    console.error("Groq API Error:", error?.response?.data || error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "Timeout — try again!" });
    }

    res.status(500).json({
      error: "Failed to process question",
      details: error?.response?.data || error.message
    });
  }
});

// 🚀 Server Start
const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Mira is running on:
- http://localhost:${PORT}`);
});
