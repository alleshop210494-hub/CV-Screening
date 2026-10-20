require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');
const localtunnel = require('localtunnel');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Inisialisasi Google AI Studio (Gemini API)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ==========================================
// TENTUKAN POSISI DAN KUALIFIKASI DI SINI
// ==========================================
const JOB_TITLE = 'Sales (Node.js)';
const JOB_REQUIREMENTS = `
  - Pendidikan minimal S1 Teknik Industri atau bidang terkait.
  - Mengelola dan memperluas basis pelanggan B2B dan B2C.
  - Mengembangkan program kerja penjualan dan ekspansi ke wilayah baru
  - Bekerja lintas departemen demi memastikan kepuasan pelanggan.
`;

// Endpoint utama untuk menerima teks CV dari Google Apps Script
app.post('/screen-cv', async (req, res) => {
  try {
    const { cvText } = req.body;

    if (!cvText) {
      return res.status(400).json({ error: 'Teks CV tidak ditemukan.' });
    }

    // Prompt analisis CV yang disesuaikan dengan kualifikasi lowongan
    const prompt = `
      Bertindaklah sebagai HRD profesional. Analisis teks CV atau lamaran berikut berdasarkan KUALIFIKASI LOWONGAN PEKERJAAN yang telah ditentukan. Berikan penilaian skor dari 0 sampai 100 berdasarkan seberapa cocok kandidat dengan kualifikasi tersebut.

      Posisi yang Dibuka: ${JOB_TITLE}
      Kualifikasi yang Dicari:
      ${JOB_REQUIREMENTS}

      Berikan penilaian dalam format JSON murni tanpa markdown backticks (tanpa \`\`\`json), dengan struktur persis seperti ini:
      {
        "score": (angka bulat dari 0 sampai 100),
        "summary": "Ringkasan singkat mengapa kandidat mendapatkan skor tersebut berdasarkan kecocokannya dengan kualifikasi di atas (maksimal 3 kalimat)"
      }

      Teks CV Kandidat:
      ${cvText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Membersihkan respons dari format markdown jika ada
    let cleanText = response.text.trim();
    cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

    let aiResult;
    try {
      aiResult = JSON.parse(cleanText);
    } catch (parseError) {
      return res.status(500).json({ error: 'Gagal memparsing respons AI ke format JSON.', rawResponse: response.text });
    }

    // Mengembalikan hasil analisis ke Google Apps Script
    return res.status(200).json({ 
      status: 'SUCCESS', 
      data: {
        score: aiResult.score,
        summary: aiResult.summary
      } 
    });

  } catch (error) {
    console.error('Error saat screening CV:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server automation screening CV berjalan di port ${PORT}`);

  // Otomatis membuat public URL agar bisa diakses Google Apps Script
  try {
    const tunnel = await localtunnel({ port: PORT });
    console.log(`\n========================================`);
    console.log(`URL PUBLIC WEBHOOK ANDA: ${tunnel.url}/screen-cv`);
    console.log(`========================================\n`);

    tunnel.on('close', () => {
      console.log('Tunnel ditutup.');
    });
  } catch (err) {
    console.error('Gagal membuat localtunnel:', err);
  }
});