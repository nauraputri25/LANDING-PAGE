const express = require("express");
const axios = require("axios"); 
const app = express();
const PORT = 3000;

// Set EJS
app.set("view engine", "ejs");
app.use(express.static("public"));

// LIMIT dinaikkan untuk menampung gambar Base64
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: '50mb' }));

// 🔗 URL WEB APP GOOGLE APPS SCRIPT
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLjemhWAcGUOUOsla77fbP_AZMgBUDAGB3UUsXJXKNn-gj291A5uSAz7qF1nwoxncG/exec";

// --- RUTE HALAMAN UTAMA ---
app.get("/", (req, res) => {
  res.render("home", { activePage: "home" });
});

app.get("/about", (req, res) => {
  res.render("about", { activePage: "about" });
});

// --- RUTE IT SUPPORT ---

// 1. Halaman Utama IT Support
app.get("/it-support", (req, res) => {
  res.render("itsupport", { activePage: "itsupport" });
});

// 2. Halaman Form Pengaduan IT Support
app.get("/it-support/form", (req, res) => {
  res.render("itsupport-form", {
    activePage: "itsupport",
    success: req.query.success,
  });
});

// 3. Proses Kirim Form IT Support ke Google Spreadsheet & Drive
app.post("/it-support/submit", async (req, res) => {
  const { 
    unit, 
    nama_request, 
    kelas, 
    permasalahan, 
    detail_permasalahan,
    fotoBase64,
    fotoMimeType 
  } = req.body;

  try {
    console.log(`[INFO] Mengirim laporan dari ${nama_request}...`);

    const responseGAS = await axios.post(APPS_SCRIPT_URL, {
      unit,
      nama_request,
      kelas,
      permasalahan,
      detail_permasalahan,
      fotoBase64,
      fotoMimeType
    }, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("[RESPON ASLI DARI GAS]:", responseGAS.data);

    // HANYA anggap sukses jika GAS secara eksplisit menjawab result: "success"
    if (responseGAS.data && responseGAS.data.result === "success") {
      console.log(`[SUKSES] Laporan dari ${nama_request} berhasil dikirim!`);
      return res.json({ status: "success", redirectUrl: "/it-support/form?success=true" });
    } else {
      console.error("[GAGAL DARI GAS]:", responseGAS.data);
      return res.json({ status: "error", redirectUrl: "/it-support/form?success=false" });
    }

  } catch (error) {
    console.error("[ERROR SERVER]:", error.message);
    return res.json({ status: "error", redirectUrl: "/it-support/form?success=false" });
  }
});

// --- RUTE GENERAL AFFAIR (GA) ---
app.get("/ga", (req, res) => {
  res.render("ga", { activePage: "ga", success: req.query.success });
});

app.post("/ga/submit", async (req, res) => {
  res.redirect("/ga?success=true");
});

// --- JALANKAN SERVER ---
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});