const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'ERROR', message: 'Method not allowed' });
  }

  try {
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
    
    // Menggunakan model gemini-1.5-flash yang kompatibel
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    
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

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return res.status(200).json({
      status: 'SUCCESS',
      data: parsedData
    });

  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};