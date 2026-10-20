const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

app.post('/screen-cv', async (req, res) => {
  try {
    // 1. Cek apakah API Key sudah terpasang di Environment Variables Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        status: 'ERROR', 
        message: 'GEMINI_API_KEY belum diatur di Environment Variables Vercel.' 
      });
    }

    const { cvText, jobPosition, jobRequirements } = req.body;
    
    if (!cvText) {
      return res.status(400).json({ 
        status: 'ERROR', 
        message: 'Teks CV tidak ditemukan dalam payload.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `Anda adalah seorang HR Recruiter profesional.
Tugas Anda adalah:
1. Menilai seberapa cocok CV kandidat dengan posisi dan kriteria pekerjaan berikut.
2. Mengekstrak nomor telepon/WhatsApp kandidat yang tertera di dalam teks CV.

Posisi Pekerjaan: ${jobPosition || 'Umum'}
Kriteria & Syarat Pekerjaan:
${jobRequirements}

Teks CV Kandidat:
${cvText}

Berikan output STRICTLY dalam format JSON berikut (tanpa Markdown formatting seperti \`\`\`json):
{
  "score": <angka_0_sampai_100>,
  "summary": "<alasan_singkat_mengapa_kandidat_mendapat_skor_tersebut_berdasarkan_kriteria>",
  "phoneNumber": "<nomor_telepon_atau_whatsapp_kandidat_jika_ada_jika_tidak_temukan_tulis_tanda_deret_strip_atau_tidak_ada>"
}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return res.json({
      status: 'SUCCESS',
      data: parsedData
    });

  } catch (error) {
    // Tangkap semua error dan kirimkan sebagai JSON agar Google Apps Script tidak syntax error
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

module.exports = app;