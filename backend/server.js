const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- PENGAMAN UTAMA ---
app.use(cors()); // Mencegah "Gagal terhubung ke server"
app.use(express.json());

// --- AKSES FOLDER UPLOADS ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); }
app.use('/uploads', express.static(uploadDir)); // Agar gambar terlihat

// --- KONEKSI DATABASE ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'osis_kenangan'
});

db.connect((err) => {
    if (err) console.error("Database mati! Aktifkan MySQL di XAMPP.");
    else console.log("Database Kenangan Terhubung!");
});

// --- KONFIGURASI UPLOAD ---
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- API ENDPOINTS ---

// GET: Mengambil data dengan nama kolom yang benar
app.get('/api/files', (req, res) => {
    const sql = `
        SELECT 
            id, file_name as fileName, file_label as fileLabel, file_type as fileType, 
            file_size as fileSize, upload_date as uploadDate,
            CONCAT('http://localhost:5000/uploads/', file_name) as filePath
        FROM files ORDER BY upload_date DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json([]);
        res.json(results);
    });
});

// POST: Upload File
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { userId, fileType } = req.body;
    db.query("INSERT INTO files (user_id, file_name, file_type, file_size) VALUES (?, ?, ?, ?)",
    [userId, req.file.filename, fileType, req.file.size], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Berhasil" });
    });
});

// DELETE: Hapus Data
app.delete('/api/files/:id', (req, res) => {
    db.query('DELETE FROM files WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "Gagal" });
        res.json({ message: "Deleted" });
    });
});


// POST: Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // TAMBAHKAN INI: Lihat di terminal VS Code Anda
    console.log("Login Detail ->", {
        email_input: `|${email}|`, 
        pass_input: `|${password}|`
    });   
    // Mencari user berdasarkan email dan password
    const sql = "SELECT id, name, email FROM users WHERE email = ? AND password = ?";
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Terjadi kesalahan pada server" });
        }
        
        if (results.length > 0) {
            // Jika user ditemukan
            res.json({ 
                user: results[0], 
                token: "dummy-token-123" // Karena belum pakai JWT, kita kirim string dummy
            });
        } else {
            // Jika user tidak ditemukan
            res.status(401).json({ message: "Email atau Password salah!" });
        }
    });
});


// POST: Register User Baru
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    
    // Cek apakah email sudah ada
    const sqlCheck = "SELECT * FROM users WHERE email = ?";
    db.query(sqlCheck, [email], (err, results) => {
        if (err) return res.status(500).json({ message: "Kesalahan Database" });
        if (results.length > 0) return res.status(400).json({ message: "Email sudah terdaftar!" });

        // Simpan ke database
        const sqlInsert = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        db.query(sqlInsert, [name, email, password], (err, result) => {
            if (err) return res.status(500).json({ message: "Gagal menyimpan user" });
            res.json({ message: "Pendaftaran berhasil! Silakan Login." });
        });
    });
});


app.put('/api/files/:id', upload.single('file'), (req, res) => {
    const fileId = req.params.id;
    const { fileName } = req.body; // Nama "keren" dari input modal

    if (req.file) {
        // Jika ganti file: update file fisik DAN label judul
        const sql = "UPDATE files SET file_name = ?, file_label = ?, file_type = ?, file_size = ? WHERE id = ?";
        db.query(sql, [req.file.filename, fileName, req.file.mimetype.startsWith('image/') ? 'image' : 'video', req.file.size, fileId], (err) => {
            if (err) return res.status(500).json({ message: "Gagal update database." });
            res.json({ message: "Media berhasil diubah" });
        });
    } else {
        // JIKA HANYA GANTI NAMA: Update file_label agar foto tidak hilang
        const sql = "UPDATE files SET file_label = ? WHERE id = ?";
        db.query(sql, [fileName, fileId], (err) => {
            if (err) return res.status(500).json({ message: "Gagal update nama." });
            res.json({ message: "Media berhasil diubah" });
        });
    }
});
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server aktif di port ${PORT}`);
});