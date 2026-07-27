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

// 🔗 URL WEB APP GOOGLE APPS SCRIPT BARU
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0foV6ZgwL6mf6VMoDPYPzr5b4mo9NvOTKdLExeOiaCrtMg_r8D0JeVdTKLibmDUWp/exec";

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
    console.log(`[INFO IT] Mengirim laporan dari ${nama_request}...`);

    const responseGAS = await axios.post(APPS_SCRIPT_URL, {
      kategori: "IT_Support",
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

    console.log("[RESPON ASLI DARI GAS - IT]:", responseGAS.data);

    if (responseGAS.data && responseGAS.data.result === "success") {
      console.log(`[SUKSES IT] Laporan dari ${nama_request} berhasil dikirim!`);
      return res.json({ status: "success", redirectUrl: "/it-support/form?success=true" });
    } else {
      console.error("[GAGAL DARI GAS - IT]:", responseGAS.data);
      return res.json({ status: "error", redirectUrl: "/it-support/form?success=false" });
    }

  } catch (error) {
    console.error("[ERROR SERVER IT]:", error.message);
    return res.json({ status: "error", redirectUrl: "/it-support/form?success=false" });
  }
});

// --- RUTE GENERAL AFFAIR (GA) ---

// 1. Halaman Utama GA (yang ada tombolnya)
app.get("/ga", (req, res) => {
  res.render("ga", { activePage: "ga", success: req.query.success });
});

// 2. Halaman Form Pengaduan GA
app.get("/ga/form", (req, res) => {
  res.render("ga-form", { activePage: "ga" });
});

// 3. Proses Submit GA
app.post("/ga/submit", async (req, res) => {
  const { 
    unit, 
    nama_request, 
    lokasi, 
    permasalahan, 
    detail_permasalahan,
    fotoBase64,
    fotoMimeType 
  } = req.body;

  try {
    console.log(`[INFO GA] Mengirim laporan dari ${nama_request}...`);

    const responseGAS = await axios.post(APPS_SCRIPT_URL, {
      kategori: "GA",
      unit,
      nama_request,
      lokasi,
      permasalahan,
      detail_permasalahan,
      fotoBase64,
      fotoMimeType
    }, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("[RESPON ASLI DARI GAS - GA]:", responseGAS.data);

    if (responseGAS.data && responseGAS.data.result === "success") {
      console.log(`[SUKSES GA] Laporan dari ${nama_request} berhasil dikirim!`);
      return res.json({ status: "success", redirectUrl: "/ga?success=true" });
    } else {
      console.error("[GAGAL DARI GAS - GA]:", responseGAS.data);
      return res.json({ status: "error", redirectUrl: "/ga/form?success=false" });
    }

  } catch (error) {
    console.error("[ERROR SERVER GA]:", error.message);
    return res.json({ status: "error", redirectUrl: "/ga/form?success=false" });
  }
});

// --- JALANKAN SERVER ---
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});