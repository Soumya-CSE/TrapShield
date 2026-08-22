import express from "express";
import cors from "cors";
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeConversation } from "./detectionEngine.js";
import { SYSTEM_PROMPT } from "./chatPrompt.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---- existing analyze route (unchanged) -----------------------------------
app.post("/api/analyze", (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Send a non-empty messages array" });
  }
  const result = analyzeConversation(messages);
  res.json(result);
});

// ---- new chat route ---------------------------------------------------
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Send a non-empty messages array" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY — check backend/.env" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    res.json({ reply });
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