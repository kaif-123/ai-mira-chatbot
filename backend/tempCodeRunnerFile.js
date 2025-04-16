require('dotenv').config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const morgan = require("morgan");

const app = express();

// ========== MIDDLEWARE ==========
app.use(morgan("dev"));
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// ========== ROUTES ==========
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", // Ensure you use the correct model
        messages: [
          {
            role: "system",
            content: "You are a helpful study assistant. Provide clear explanations."
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ answer: response.data.choices[0].message.content });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Failed to process question",
      details: process.env.NODE_ENV === "development" ? error.message : null
    });
  }
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on:
  - http://localhost:${PORT}
  - http://127.0.0.1:${PORT}`);
});
