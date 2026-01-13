import React, { useState, useEffect, useMemo } from 'react';
import { AuthState, FileData } from './types';
import { Layout } from './components/Layout';
import { FileCard } from './components/FileCard';
import { UploadModal } from './components/UploadModal';

const API_URL = 'https://unchiming-sorely-leatha.ngrok-free.dev/api';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null, token: null });
  const [files, setFiles] = useState<FileData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  
  // State untuk Edit Media & Notifikasi
  const [editingFile, setEditingFile] = useState<FileData | null>(null);
  const [editForm, setEditForm] = useState({ name: '', file: null as File | null });
  const [showSuccess, setShowSuccess] = useState(false);

  // 1. Fetch data dari Database
const fetchFiles = async () => {
  try {
    const res = await fetch(`${API_URL}/files`, {
      method: 'GET', // Opsional tapi baik untuk memperjelas
      headers: {
        "ngrok-skip-browser-warning": "any-value", // Nilai bisa apa saja
      },
    });

    // Cek apakah responnya benar-benar JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await res.json();
      setFiles(data);
    } else {
      console.error("Server tidak mengirim JSON, tapi:", await res.text());
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
};

  // 2. Handler Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "69420", },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setIsRegisterMode(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    }
  };

  // 3. Handler Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "69420", },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setAuth({ isAuthenticated: true, user: data.user, token: data.token });
      } else {
        setError(data.message || "Login gagal.");
      }
    } catch (err) { 
      setError("Gagal terhubung ke server."); 
    }
  };

  // 4. Handler Hapus
  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kenangan ini?")) return;
    try {
      const res = await fetch(`${API_URL}/files/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFiles();
    } catch (e) { 
      alert("Gagal menghapus file"); 
    }
  };
 

  //function update 
 const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingFile) return;

  const fd = new FormData();
  // Pastikan kunci ini 'fileName' bukan 'name'
  fd.append('fileName', editForm.name); 
  
  if (editForm.file) {
    fd.append('file', editForm.file);
  }

  try {
    const res = await fetch(`${API_URL}/files/${editingFile.id}`, {
      method: 'PUT',
      body: fd, // Kirim FormData
    });

    if (res.ok) {
      setEditingFile(null);
      fetchFiles();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      const errorData = await res.json();
      alert(errorData.message || "Gagal memperbarui database.");
    }
  } catch (e) {
    alert("Gagal terhubung ke server.");
  }
};

// 6. Logika Filter & Pencarian yang Diperbaiki
const filteredFiles = useMemo(() => {
  if (!Array.isArray(files)) return [];
  
  return files.filter(f => {
    // Ambil data label (judul) dan nama file asli
    const label = (f.fileLabel || "").toLowerCase();
    const name = (f.fileName || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    // Sekarang sistem mencari di "Label/Judul" ATAU di "Nama File Asli"
    const matchesSearch = label.includes(search) || name.includes(search);
    
    // Filter kategori (Foto/Video)
    const type = (f.fileType || "").toLowerCase();
    const matchesFilter = filter === 'ALL' || type === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });
}, [files, searchTerm, filter]);

// 7. Handler Upload Baru
  const handleUpload = async (name: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', auth.user?.id?.toString() || '');
    fd.append('fileType', file.type.startsWith('image/') ? 'image' : 'video');
    // Tambahkan juga parameter name jika backend Anda membutuhkannya untuk fileLabel
    fd.append('fileName', name); 

    try {
      const res = await fetch(`${API_URL}/upload`, { 
        method: 'POST', 
        body: fd,
        // TAMBAHKAN HEADER DI SINI
        headers: {
          "ngrok-skip-browser-warning": "69420",
        }
      });

      if (res.ok) {
        setIsUploadModalOpen(false);
        fetchFiles();
        // Optional: beri notifikasi sukses
        alert("Kenangan berhasil diunggah!");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Gagal mengupload file");
      }
    } catch (e) {
      alert("Gagal terhubung ke server saat upload");
    }
  };
  

  // UI Login & Register
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border">
          <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">
            {isRegisterMode ? 'Daftar Akun Baru' : 'Kenangan OSIS 36'}
          </h1>
          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
            {isRegisterMode && (
              <input 
                type="text" placeholder="Nama Lengkap" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
                onChange={e => setRegisterForm({...registerForm, name: e.target.value})} required 
              />
            )}
            <input 
              type="email" placeholder="Email" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
              onChange={e => isRegisterMode ? setRegisterForm({...registerForm, email: e.target.value}) : setLoginForm({...loginForm, email: e.target.value})} required 
            />
            <input 
              type="password" placeholder="Password" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
              onChange={e => isRegisterMode ? setRegisterForm({...registerForm, password: e.target.value}) : setLoginForm({...loginForm, password: e.target.value})} required 
            />
            {error && <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}
            <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
              {isRegisterMode ? 'Daftar Sekarang' : 'Masuk'}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-slate-600">
            {isRegisterMode ? 'Sudah punya akun?' : 'Belum punya akun?'} {' '}
            <button onClick={() => { setIsRegisterMode(!isRegisterMode); setError(null); }} className="text-blue-600 font-bold hover:underline">
              {isRegisterMode ? 'Login di sini' : 'Daftar Sekarang'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // UI Dashboard
  return (
    <Layout user={auth.user} onLogout={() => setAuth({isAuthenticated:false, user:null, token:null})}>
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <input 
          type="text" placeholder="Cari kenangan..." 
          className="flex-grow px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm outline-none"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
        <button onClick={() => setIsUploadModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">
          Upload Baru
        </button>
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        {(['ALL', 'IMAGE', 'VIDEO'] as const).map(t => (
          <button 
            key={t} onClick={() => setFilter(t)} 
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t === 'ALL' ? 'Semua' : t === 'IMAGE' ? 'Foto' : 'Video'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredFiles.length > 0 ? (
          filteredFiles.map(file => (
            <FileCard 
              key={file.id} 
              file={file} 
              onDelete={handleDelete} 
              // Menghubungkan tombol Edit di FileCard ke Modal
              onEdit={() => {
                setEditingFile(file);
                setEditForm({ name: file.fileName, file: null });
              }} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            Belum ada kenangan yang ditemukan.
          </div>
        )}
      </div>
      
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUpload} />

      {/* Modal Edit Media */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Edit Detail Media</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Nama Media</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Ganti File (Opsional)</label>
                <input 
                  type="file" 
                  className="w-full text-sm mt-1"
                  onChange={(e) => setEditForm({...editForm, file: e.target.files?.[0] || null})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-grow py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                  Simpan Perubahan
                </button>
                <button type="button" onClick={() => setEditingFile(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Notifikasi Sukses */}
      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-white border-2 border-green-500 px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="bg-green-500 text-white rounded-full p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-green-700">Perubahan berhasil disimpan!</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;