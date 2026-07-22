const express = require("express");
const axios = require("axios"); // Library untuk kirim data
const app = express();
const PORT = 3000;

// Set EJS & Body Parser
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// 🔗 URL WEB APP GOOGLE APPS SCRIPT KAMU
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwBuq6R8DMTIiRYTx_MnRQoYDHr2A6wPjrdD41uoR-HXsS7q79e471CTl03bIumg6wd/exec";

// --- RUTE HALAMAN UTAMA ---
app.get("/", (req, res) => {
  res.render("home", { activePage: "home" });
});

app.get("/about", (req, res) => {
  res.render("about", { activePage: "about" });
});

// --- RUTE IT SUPPORT ---
app.get("/it-support", (req, res) => {
  res.render("itsupport", {
    activePage: "itsupport",
    success: req.query.success,
  });
});

app.post("/it-support/submit", async (req, res) => {
  // Menangkap data dari form EJS
  const { unit, nama_request, kelas, permasalahan, detail_permasalahan } = req.body;

  try {
    // Kirim data ke Spreadsheet pakai axios
    await axios.post(APPS_SCRIPT_URL, {
      unit,
      nama_request,
      kelas,
      permasalahan,
      detail_permasalahan
    });

    res.redirect("/it-support?success=true");
  } catch (error) {
    console.error("Gagal mengirim data ke Spreadsheet:", error.message);
    res.redirect("/it-support?success=false");
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