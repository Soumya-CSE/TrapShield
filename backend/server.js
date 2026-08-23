import express from "express";
import cors from "cors";
import "dotenv/config";
import {GoogleGenAI} from "@google/genai";
import { analyzeConversation } from "./detectionEngine.js";
import { SYSTEM_PROMPT } from "./chatPrompt.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GUIDANCE = {
  isolation:
    "Someone asking you to keep them secret from your parents or friends is a warning sign on its own — healthy relationships don't need to be hidden.",
  secrecy:
    "Being asked to delete messages or hide a conversation is a tactic to remove evidence. Consider saving screenshots somewhere the other person can't access.",
  loveBombing:
    "Very fast, very intense affection can feel amazing, but it's also a known tactic to build trust quickly before asking for something. It's okay to slow down.",
  offPlatform:
    "Being pushed to move to a different app is often done to avoid safety features and reporting tools on the original platform. You don't have to switch.",
  photoRequest:
    "No one you haven't met and trust in person needs photos of you, especially private ones. It's okay to say no, even if you've sent things before.",
  financial:
    "Requests for money or gift cards from someone you met online are a major red flag for scams, regardless of the story behind them.",
  threatCoercion:
    "Threats to share private content are a form of coercion. This is illegal in many places, and you will not be in trouble for reporting it or asking for help.",
  urgencyPressure:
    "Pressure to respond immediately or guilt for not responding is designed to stop you from thinking it through. A person who respects you will give you space.",
  meetOffline:
    "Meeting someone from online in person, especially without telling a trusted adult, carries real risk. If you do meet, it should be public, and someone should know.",
};

function buildGuidance(result) {
  const cats = Object.keys(result.categoryTally || {});
  const tips = cats.map((c) => GUIDANCE[c]).filter(Boolean);
  if (tips.length === 0) {
    return [
      "Nothing in this conversation matched known manipulation patterns. Trust your instincts anyway — if something feels off, it's okay to step back or talk to someone you trust.",
    ];
  }
  return tips;
}

app.post("/api/analyze", (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Send a non-empty messages array" });
  }
  const result = analyzeConversation(messages);
  const guidance = buildGuidance(result);
  res.json({ ...result, guidance });
});

// ---- new chat route ---------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Send a non-empty messages array" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY — check backend/.env" });
  }

  try {
    // Gemini uses "model"/"user" roles instead of "assistant"/"user"
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await genAI.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Something went wrong reaching the Guide." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});