const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Inisialisasi dengan penamaan kelas yang benar: GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/screen-cv', async (req, res) => {
  try {
    const { cvText, jobPosition, jobRequirements } = req.body;

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

    // Memanggil model menggunakan instance genAI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Membersihkan format markdown jika terbawa
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    res.json({
      status: 'SUCCESS',
      data: parsedData
    });

  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Export untuk Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
}