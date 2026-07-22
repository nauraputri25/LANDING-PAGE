const express = require("express");
const { google } = require("googleapis");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Konfigurasi Google Sheets API (Masukkan Spreadsheet ID Anda)
const SPREADSHEET_ID = "MASUKKAN_SPREADSHEET_ID_ANDA_DISINI";

async function appendToSheet(range, values) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
    return true;
  } catch (error) {
    console.error("Gagal menyimpan ke Google Spreadsheet:", error);
    return false;
  }
}

// Rute Halaman
app.get("/", (req, res) => {
  res.render("home", { activePage: "home" });
});

app.get("/it-support", (req, res) => {
  res.render("itsupport", {
    activePage: "itsupport",
    success: req.query.success,
  });
});

app.post("/it-support/submit", async (req, res) => {
  const { nama, unit, kendala, prioritas } = req.body;
  const tanggal = new Date().toLocaleString();
  const success = await appendToSheet("IT_Support!A:E", [
    tanggal,
    nama,
    unit,
    kendala,
    prioritas,
  ]);
  res.redirect("/it-support?success=" + (success ? "true" : "false"));
});

app.get("/ga", (req, res) => {
  res.render("ga", { activePage: "ga", success: req.query.success });
});

app.post("/ga/submit", async (req, res) => {
  const { nama, unit, jenisPengajuan, keterangan } = req.body;
  const tanggal = new Date().toLocaleString();
  const success = await appendToSheet("GA!A:E", [
    tanggal,
    nama,
    unit,
    jenisPengajuan,
    keterangan,
  ]);
  res.redirect("/ga?success=" + (success ? "true" : "false"));
});

app.get("/about", (req, res) => {
  res.render("about", { activePage: "about" });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
