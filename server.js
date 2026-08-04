const express = require("express");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(express.json({ limit: '50mb' }));

// 🔗 URL WEB APP GOOGLE APPS SCRIPT
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6TmU4P0ey1akWkQKOEeTrDT3Jl3YVaTlqTn4-0v2jnGIImewA9mrbHQArUzeiVZ7y/exec";

// --- VARIABEL CACHE IT & GA ---
let cacheDataIT = null;
let lastFetchTimeIT = 0;

let cacheDataGA = null;
let lastFetchTimeGA = 0;

const CACHE_DURATION = 60 * 1000; 

function calculateStats(reports) {
  const stats = {
    total: reports.length,
    menunggu: 0,
    diproses: 0,
    pending: 0,
    selesai: 0
  };

  reports.forEach(item => {
    const status = (item.status || '').trim().toLowerCase();
    if (status.includes('menunggu')) stats.menunggu++;
    else if (status.includes('diproses')) stats.diproses++;
    else if (status.includes('pending')) stats.pending++;
    else if (status.includes('selesai')) stats.selesai++;
  });

  return stats;
}

function formatTanggalIndo(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\./g, ':');
}

// --- RUTE HALAMAN UTAMA (HOME) ---
app.get("/", async (req, res) => {
  const now = Date.now();
  let rawIT = [];
  let rawGA = [];

  // 1. Fetch Data IT
  if (cacheDataIT && (now - lastFetchTimeIT < CACHE_DURATION)) {
    rawIT = cacheDataIT;
  } else {
    try {
      const resIT = await fetch(`${APPS_SCRIPT_URL}?kategori=IT_Support&t=${now}`);
      if (resIT.ok) {
        const jsonIT = await resIT.json();
        if (jsonIT && jsonIT.result === "success" && Array.isArray(jsonIT.data)) {
          rawIT = jsonIT.data.slice(1);
          cacheDataIT = rawIT;
          lastFetchTimeIT = now;
        }
      }
    } catch (err) {
      if (cacheDataIT) rawIT = cacheDataIT;
    }
  }

  // 2. Fetch Data GA
  if (cacheDataGA && (now - lastFetchTimeGA < CACHE_DURATION)) {
    rawGA = cacheDataGA;
  } else {
    try {
      const resGA = await fetch(`${APPS_SCRIPT_URL}?kategori=GA&t=${now}`);
      if (resGA.ok) {
        const jsonGA = await resGA.json();
        if (jsonGA && jsonGA.result === "success" && Array.isArray(jsonGA.data)) {
          rawGA = jsonGA.data.slice(1);
          cacheDataGA = rawGA;
          lastFetchTimeGA = now;
        }
      }
    } catch (err) {
      if (cacheDataGA) rawGA = cacheDataGA;
    }
  }

  const reportsIT = rawIT.map((row, index) => ({
    id: index + 1,
    waktu: formatTanggalIndo(row[0]),
    unit: row[1] || '-',
    nama: row[2] || '-',
    kelas: row[3] || '-',
    permasalahan: row[4] || '-',
    detail: row[5] || '-',
    foto: row[6] || '',
    status: row[7] || 'Menunggu ACC'
  })).reverse(); 

  const reportsGA = rawGA.map((row, index) => ({
    id: index + 1,
    waktu: formatTanggalIndo(row[0]),
    unit: row[1] || '-',
    nama: row[2] || '-',
    lokasi: row[3] || '-',
    permasalahan: row[4] || '-',
    detail: row[5] || '-',
    foto: row[6] || '',
    status: row[7] || 'Menunggu ACC'
  })).reverse(); 

  const statsIT = calculateStats(reportsIT);
  const statsGA = calculateStats(reportsGA);

  res.render("home", { 
    activePage: "home",
    reportsIT: reportsIT,
    reportsGA: reportsGA,
    statsIT: statsIT,
    statsGA: statsGA
  });
});

app.get("/about", (req, res) => {
  res.render("about", { activePage: "about" });
});

// --- RUTE IT SUPPORT ---
app.get("/it-support", async (req, res) => {
  const now = Date.now();

  if (cacheDataIT && (now - lastFetchTimeIT < CACHE_DURATION)) {
    return renderITPage(res, cacheDataIT);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); 

  try {
    const fetchUrl = `${APPS_SCRIPT_URL}?kategori=IT_Support&t=${now}`;
    
    const response = await fetch(fetchUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }

    const result = await response.json();
    let rawReports = [];
    if (result && result.result === "success" && Array.isArray(result.data)) {
      rawReports = result.data.slice(1); 
    }

    cacheDataIT = rawReports;
    lastFetchTimeIT = now;

    renderITPage(res, rawReports);

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("[ERROR FETCH IT]: Request Timeout (Lebih dari 8 detik)");
    } else {
      console.error("[ERROR FETCH DATA IT]:", error.message);
    }
    
    if (cacheDataIT) {
      return renderITPage(res, cacheDataIT);
    }
    renderITPage(res, []);
  }
});

function renderITPage(res, rawReports) {
  const reports = rawReports.map((row, index) => {
    return {
      id: index + 1,
      waktu: formatTanggalIndo(row[0]),
      unit: row[1] || '-',
      nama: row[2] || '-',
      kelas: row[3] || '-',
      permasalahan: row[4] || '-',
      detail: row[5] || '-',
      foto: row[6] || '',
      status: row[7] || 'Menunggu ACC'
    };
  });
  
  const stats = {
    totalTiket: reports.length,
    units: {},
    categories: {},
    statuses: {}
  };

  reports.forEach(item => {
    stats.units[item.unit] = (stats.units[item.unit] || 0) + 1;
    stats.categories[item.permasalahan] = (stats.categories[item.permasalahan] || 0) + 1;
    stats.statuses[item.status] = (stats.statuses[item.status] || 0) + 1;
  });

  res.render("itsupport", { 
    activePage: "itsupport", 
    reports: reports,
    stats: stats
  });
}

// 2. Halaman Form Pengaduan IT Support
app.get("/it-support/form", (req, res) => {
  res.render("itsupport-form", {
    activePage: "itsupport",
    success: req.query.success,
  });
});

// 3. Proses Kirim Form IT Support ke Google Apps Script
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
    
    const responseGAS = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kategori: "IT_Support",
        unit,
        nama_request,
        kelas,
        permasalahan,
        detail_permasalahan,
        fotoBase64,
        fotoMimeType
      }),
      redirect: "follow"
    });

    const dataGAS = await responseGAS.json();
    console.log("[RESPON GAS IT]:", dataGAS);

    if (dataGAS && (dataGAS.result === "success" || dataGAS.status === "success")) {
      console.log(`[SUKSES IT] Laporan dari ${nama_request} tersimpan!`);
      cacheDataIT = null; // Reset cache
      return res.json({ status: "success", redirectUrl: "/it-support/form?success=true" });
    } else {
      console.error("[GAGAL GAS IT]:", dataGAS);
      return res.json({ status: "error", redirectUrl: "/it-support/form?success=false" });
    }

  } catch (error) {
    console.error("[ERROR SERVER IT]:", error.message);
    return res.json({ status: "error", redirectUrl: "/it-support/form?success=false" });
  }
});

// --- RUTE GENERAL AFFAIR (GA) ---
function renderGAPage(res, rawReports, querySuccess) {
  const reports = rawReports.map((row, index) => {
    return {
      id: index + 1,
      waktu: formatTanggalIndo(row[0]),
      unit: row[1] || '-',
      nama: row[2] || '-',
      lokasi: row[3] || '-',
      permasalahan: row[4] || '-',
      detail: row[5] || '-',
      foto: row[6] || '',
      status: row[7] || 'Menunggu ACC'
    };
  });
  
  const stats = {
    totalTiket: reports.length,
    categories: {}
  };

  reports.forEach(item => {
    stats.categories[item.permasalahan] = (stats.categories[item.permasalahan] || 0) + 1;
  });

  res.render("ga", { 
    activePage: "ga", 
    reports: reports,
    stats: stats,
    success: querySuccess
  });
}

// 1. Halaman Utama GA (Fetch Data dari Google Sheets)
app.get("/ga", async (req, res) => {
  const now = Date.now();

  if (cacheDataGA && (now - lastFetchTimeGA < CACHE_DURATION)) {
    return renderGAPage(res, cacheDataGA, req.query.success);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); 

  try {
    const fetchUrl = `${APPS_SCRIPT_URL}?kategori=GA&t=${now}`;
    
    const response = await fetch(fetchUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }

    const result = await response.json();
    let rawReports = [];
    if (result && result.result === "success" && Array.isArray(result.data)) {
      rawReports = result.data.slice(1);
    }

    cacheDataGA = rawReports;
    lastFetchTimeGA = now;

    renderGAPage(res, rawReports, req.query.success);

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("[ERROR FETCH GA]: Request Timeout");
    } else {
      console.error("[ERROR FETCH DATA GA]:", error.message);
    }
    
    if (cacheDataGA) {
      return renderGAPage(res, cacheDataGA, req.query.success);
    }
    renderGAPage(res, [], req.query.success);
  }
});

// 2. Halaman Form Pengaduan GA
app.get("/ga/form", (req, res) => {
  res.render("ga-form", { activePage: "ga" });
});

// 3. Proses Submit GA (Perbaikan)
app.post("/ga/submit", async (req, res) => {
  // Ambil kelas ATAU lokasi dari req.body
  const { 
    unit, 
    nama_request, 
    kelas,
    lokasi, 
    permasalahan, 
    detail_permasalahan,
    fotoBase64,
    fotoMimeType 
  } = req.body;

  // Tentukan nilai lokasi/kelas agar tidak undefined
  const nilaiLokasi = lokasi || kelas || "-";

  try {
    console.log(`[INFO GA] Mengirim laporan dari ${nama_request}...`);
    
    const responseGAS = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kategori: "GA",
        unit,
        nama_request,
        kelas: nilaiLokasi,   
        lokasi: nilaiLokasi, 
        permasalahan,
        detail_permasalahan,
        fotoBase64,
        fotoMimeType
      }),
      redirect: "follow"
    });
    
    const dataGAS = await responseGAS.json();
    console.log("[RESPON GAS GA]:", dataGAS);
    
    if (dataGAS && (dataGAS.result === "success" || dataGAS.status === "success")) {
      console.log(`[SUKSES GA] Laporan dari ${nama_request} tersimpan!`);
      cacheDataGA = null; // Reset cache
      return res.json({ status: "success", redirectUrl: "/ga?success=true" });
    } else {
      console.error("[GAGAL GAS GA]:", dataGAS);
      return res.json({ status: "error", redirectUrl: "/ga/form?success=false" });
    }
  } catch (error) {
    console.error("[ERROR SERVER GA]:", error.message);
    return res.json({ status: "error", redirectUrl: "/ga/form?success=false" });
  }
});

// --- JALANKAN SERVER ---
app.listen(PORT, () => {
  console.log(`Server berjalan dengan sukses di http://localhost:${PORT}`);
});
