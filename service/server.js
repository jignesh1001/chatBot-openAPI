const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

let sheetJSON = [];

// ✅ Allow only specific origin (React frontend)


app.use(cors({
  origin:  process.env.CLIENT_URL, // replace with your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true // if you use cookies or session
}));



// ✅ Upload Excel file and parse it
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    sheetJSON = xlsx.utils.sheet_to_json(sheet);

    fs.unlinkSync(req.file.path); // cleanup
    res.json({ message: 'Sheet uploaded and parsed successfully' });
  } catch (error) {
    console.error('Error uploading sheet:', error);
    res.status(500).json({ error: 'Failed to parse Excel file' });
  }
});

// ✅ Ask question using OpenRouter
app.get('/ask', async (req, res) => {
  const question = req.query.q;
  if (!sheetJSON.length) return res.status(400).json({ error: 'Please upload an Excel sheet first.' });
  if (!question) return res.status(400).json({ error: 'No question provided.' });

  const prompt = `You are a helpful assistant. Answer the question using ONLY this data:\n\n${JSON.stringify(sheetJSON, null, 2)}\n\nQuestion: ${question}`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Answer using only the data provided.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173'  || 'https://chat-bot-open-api.vercel.app/',
          'X-Title': 'Excel-QA-Bot'
        }
      }
    );

    const answer = response.data.choices[0].message.content.trim();
    console.log(answer)
    res.json({ answer });
  } catch (error) {
    console.error('Error from OpenRouter:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from OpenRouter API' });
  }
});

// ✅ Start the server
app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
