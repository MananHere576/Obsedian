
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const upload = multer({ dest: "uploads/" });
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));


let resumeText = "";
let chatHistory = []; 

app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    if (req.file) {
      const filepath = req.file.path;
      const original = req.file.originalname || "resume";
      const ext = path.extname(original).toLowerCase();
      if (ext === ".pdf") {
        const data = fs.readFileSync(filepath);
        const parsed = await pdfParse(data);
        resumeText = parsed.text || "";
      } else {

        const data = fs.readFileSync(filepath, "utf8");
        resumeText = data;
      }
      fs.unlinkSync(filepath); // cleanup
      return res.json({ ok: true, resumeTextSnippet: resumeText.slice(0, 800) });
    } else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
      return res.json({ ok: true, resumeTextSnippet: resumeText.slice(0, 800) });
    } else {
      return res.status(400).json({ ok: false, error: "No resume provided" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const { question, history } = req.body;

    const promptParts = [];
    promptParts.push("You are an interview assistant.");
    promptParts.push("Use the candidate's resume below to answer questions about the candidate. When the answer is clearly in the resume, respond in the first person ('I', 'my') as the candidate.");
    promptParts.push("If the question cannot be answered from the resume (for example, technical concepts, general knowledge, definitions, or HR questions), respond accurately in a neutral, factual tone, like a knowledgeable assistant. Do NOT mention the resume in such answers.");
    promptParts.push("Always provide complete, human-like, professional answers suitable for a real interview. Include examples when appropriate.");
    promptParts.push("Resume:");
    promptParts.push(resumeText || "(no resume uploaded)");
    promptParts.push("Chat history (most recent last):");
    if (Array.isArray(history)) {
      history.forEach(h => promptParts.push(`${h.role}: ${h.text}`));
    }
    promptParts.push("Question:");
    promptParts.push(question);

    const finalPrompt = promptParts.join("\n\n");

    const modelResp = await makeModelRequest(finalPrompt);

    const answer = modelResp.answer || "Sorry, I couldn't generate an answer.";
    const entry = { question, answer, timestamp: new Date().toISOString() };
    chatHistory.push(entry);

    return res.json({ ok: true, answer, chatHistory });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Gemini integration with longer, human-like answers
async function makeModelRequest(prompt) {
  const key = process.env.MODEL_API_KEY || "";
  if (!key) {
    return { answer: `DEMO REPLY: (No API key set).\n\nYour question: ${prompt.slice(-600)}` };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

  try {
    const resp = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1024, // increase answer length
          temperature: 0.9,      // more human-like, creative
          topP: 0.95,            // diverse output
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // slightly higher for longer responses
      }
    );

    const text =
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      JSON.stringify(resp.data).slice(0, 1000);

    return { answer: text };
  } catch (err) {
    console.error("model call failed", err.response?.data || err.message || err);
    return { answer: "Model call failed: " + (err.response?.data?.error?.message || err.message) };
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server started on port", PORT));
