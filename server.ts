import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI Summarize route
app.post('/api/ai/summarize', async (req, res) => {
  try {
    const { text, fileName } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text content' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Deterministic fallback summary if no API key configured
      const words = text.trim().split(/\s+/).length;
      return res.json({
        summary: `### Document Overview: ${fileName || 'Document'}\n\n**Key Takeaways:**\n- **Word Count:** ~${words} words extracted.\n- **Primary Subject:** Document analysis completed successfully in offline simulation mode.\n- **Main Sections:** Introduction, technical specifications, operational procedures, and concluding remarks.\n- **Action Items:** Review highlighted sections, verify signer credentials, and ensure regulatory alignment.\n\n*(Note: Configure GEMINI_API_KEY for live deep reasoning summaries)*`,
        source: 'local_fallback',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are a professional PDF document analysis assistant in an iLovePDF-style Android app.
Summarize the following document content clearly and concisely with:
1. Executive Summary (2-3 sentences)
2. Key Findings & Bullet Points
3. Critical Numbers/Dates/Entities
4. Recommended Next Steps

Document Name: ${fileName || 'Uploaded PDF'}
Content:
${text.slice(0, 30000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      summary: response.text || 'No summary could be generated.',
      source: 'gemini-2.5-flash',
    });
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate summary',
      fallback: 'An error occurred while communicating with Gemini API.',
    });
  }
});

// Gemini AI Translate route
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.json({
        translatedText: `[Translated into ${targetLanguage} (Simulation Mode)]:\n\n${text.slice(0, 500)}...`,
        targetLanguage,
        source: 'local_fallback',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `Translate the following text into ${targetLanguage}. Maintain tone, formatting, and structural bullet points accurately.
Text to translate:
${text.slice(0, 20000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({
      translatedText: response.text || '',
      targetLanguage,
      source: 'gemini-2.5-flash',
    });
  } catch (error: any) {
    console.error('Error generating AI translation:', error);
    res.status(500).json({
      error: error.message || 'Failed to translate document',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
