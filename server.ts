import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Login API endpoint
  app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    // Simple simulation: any username/password works for this demo
    if (username && password) {
      res.json({ success: true, token: "demo-token-123", user: { name: "Support Agent", role: "agent" } });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  });

  // Chat API endpoint
  app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // Fallback if API key is not configured
        setTimeout(() => {
          res.json({ 
            response: `[DEMO MODE] I received your message: "${message}". Please configure your GEMINI_API_KEY to enable real AI responses.` 
          });
        }, 1000);
        return;
      }

      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: "You are the BIET Support Bot, a helpful assistant for Bharat Institute of Engineering and Technology. Answer student queries about admissions, courses, facilities, and campus life politely and concisely."
        }
      });

      res.json({ response: response.text });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
