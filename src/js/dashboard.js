// ============================================
// dashboard.js - HATORI Group Dashboard Controller
// ============================================

// ========== DETEKSI LINGKUNGAN ==========
const isElectron = window.electronAPI !== undefined;
console.log(`🔍 Running in: ${isElectron ? 'Electron (Desktop)' : 'Browser'}`);

// ========== CEK MODE DATABASE ==========
const USE_DATABASE = true; // SET true UNTUK PAKAI SUPABASE

// ========== FORCE TANGGAL HARI INI ==========
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ========== GET KUOTA IZIN DARI SETTINGS ==========
function getKuotaIzinPerHari() {
  const kuota = localStorage.getItem('settings_izin_kuota_per_hari');
  if (kuota && !isNaN(parseInt(kuota))) {
    return parseInt(kuota);
  }
  return 40;
}

// ========== HITUNG TOTAL IZIN AKTIF (BELUM KEMBALI) ==========
function getTotalIzinAktif() {
  const today = getTodayDate();
  const aktif = izinData.filter(item => 
    item.date === today && 
    item.status === 'Izin Keluar'
  ).length;
  return aktif;
}

// ========== UPDATE TOTAL IZIN AKTIF ==========
function updateTotalIzinAktif() {
  const el = document.getElementById('totalIzinAktif');
  if (el) {
    const total = getTotalIzinAktif();
    el.textContent = total;
  }
}

// ========== FUNGSI UNTUK MENDAPATKAN USER LOGIN ==========
function getCurrentLoggedInUser() {
    try {
        const savedUser = localStorage.getItem('hrpro_current_user');
        if (savedUser) {
            return JSON.parse(savedUser);
        }
    } catch(e) {
        console.error('Error getting current user:', e);
    }
    return null;
}

// ========== CEK PERMISSIONS USER ==========
function getUserPermissions() {
    const currentUser = getCurrentLoggedInUser();
    if (!currentUser) return { menus: [], permissions: [] };
    
    const userRole = currentUser.role || 'User';
    
    // Load roles data
    let rolesDataLocal = [];
    try {
        const saved = localStorage.getItem('hrpro_roles_data');
        if (saved) {
            rolesDataLocal = JSON.parse(saved);
        }
    } catch(e) {}
    
    if (rolesDataLocal.length === 0 && typeof rolesData !== 'undefined') {
        rolesDataLocal = rolesData;
    }
    
    // Cari role yang sesuai
    const roleData = rolesDataLocal.find(r => r.roleName === userRole);
    
    if (roleData) {
        let menus = roleData.menus || [];
        // ===== PERBAIKAN: Filter untuk Admin =====
        if (userRole === 'Admin') {
            menus = menus.filter(m => m !== 'roles' && m !== 'pengaturan');
        }
        return {
            menus: menus,
            permissions: roleData.permissions || []
        };
    }
    
    // Fallback default
    const defaultMenus = {
        'Superadmin': ['dashboard', 'karyawan', 'izin', 'laporan', 'users', 'roles', 'pengaturan', 'api-telegram'],
        'Admin': ['dashboard', 'karyawan', 'izin', 'laporan', 'users', 'api-telegram'],
        'User': ['dashboard', 'karyawan', 'izin']
    };
    const defaultPermissions = {
        'Superadmin': ['create', 'edit', 'delete'],
        'Admin': ['create', 'edit', 'delete'],
        'User': ['create']
    };
    
    let menus = defaultMenus[userRole] || defaultMenus['User'];
    // ===== PERBAIKAN: Filter untuk Admin =====
    if (userRole === 'Admin') {
        menus = menus.filter(m => m !== 'roles' && m !== 'pengaturan');
    }
    
    return {
        menus: menus,
        permissions: defaultPermissions[userRole] || defaultPermissions['User']
    };
}

// ========== CEK APAKAH USER MEMILIKI PERMISSION ==========
function hasPermission(permission) {
    const perms = getUserPermissions();
    return perms.permissions.includes(permission);
}

// ========== CEK APAKAH USER BISA MELIHAT MENU ==========
function canViewMenu(menu) {
    const perms = getUserPermissions();
    return perms.menus.includes(menu);
}

// ========== CEK APAKAH USER BISA MEMILIH KARYAWAN ==========
function canSelectEmployee(employeeName) {
    const currentUser = getCurrentLoggedInUser();
    if (!currentUser) return true;
    
    const userRole = currentUser.role || 'User';
    
    if (userRole === 'Superadmin' || userRole === 'Admin') {
        return true;
    }
    
    const userName = currentUser.name || currentUser.email;
    return employeeName.toLowerCase() === userName.toLowerCase();
}

// ========== GET NAMA USER YANG LOGIN ==========
function getCurrentUserName() {
    const currentUser = getCurrentLoggedInUser();
    if (currentUser) {
        return currentUser.name || currentUser.email || '';
    }
    return '';
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'info') {
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s';
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// ========== DATA ==========
const attendanceData = [
  { name: 'Budi Santoso', division: 'Inatogel', status: 'Hadir', time: '08:15' },
  { name: 'Siti Rahayu', division: 'Kepritogel', status: 'Izin', time: '09:30' },
  { name: 'Agus Wijaya', division: 'Hatoribet', status: 'Hadir', time: '08:05' },
  { name: 'Dewi Lestari', division: 'Livitoto', status: 'Terlambat', time: '09:55' },
  { name: 'Rudi Hartono', division: 'Hmd29', status: 'Alpha', time: '-' },
  { name: 'Maya Sari', division: 'Inatogel', status: 'Hadir', time: '07:58' },
];

let karyawanData = [
  { 
    id: 'EMP001', 
    name: 'Budi Santoso',
    initial: 'BS',
    division: 'Inatogel',
    position: 'Senior Developer', 
    phone: '0812-3456-7890',
    joinDate: '2020-03-15',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=3b82f6&color=fff&size=40'
  },
  { 
    id: 'EMP002', 
    name: 'Siti Rahayu',
    initial: 'SR',
    division: 'Kepritogel',
    position: 'Marketing Manager', 
    phone: '0813-9876-5432',
    joinDate: '2019-07-01',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Siti+Rahayu&background=16a34a&color=fff&size=40'
  },
  { 
    id: 'EMP003', 
    name: 'Agus Wijaya',
    initial: 'AW',
    division: 'Hatoribet',
    position: 'Finance Analyst', 
    phone: '0821-2345-6789',
    joinDate: '2021-01-10',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Agus+Wijaya&background=ea580c&color=fff&size=40'
  },
  { 
    id: 'EMP004', 
    name: 'Dewi Lestari',
    initial: 'DL',
    division: 'Livitoto',
    position: 'HR Specialist', 
    phone: '0856-7890-1234',
    joinDate: '2020-09-20',
    status: 'Cuti',
    photo: 'https://ui-avatars.com/api/?name=Dewi+Lestari&background=8b5cf6&color=fff&size=40'
  },
  { 
    id: 'EMP005', 
    name: 'Rudi Hartono',
    initial: 'RH',
    division: 'Hmd29',
    position: 'Junior Developer', 
    phone: '0811-4567-8901',
    joinDate: '2022-06-01',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Rudi+Hartono&background=dc2626&color=fff&size=40'
  },
  { 
    id: 'EMP006', 
    name: 'Maya Sari',
    initial: 'MS',
    division: 'Inatogel',
    position: 'Content Creator', 
    phone: '0878-1234-5678',
    joinDate: '2021-11-15',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Maya+Sari&background=3b82f6&color=fff&size=40'
  },
  { 
    id: 'EMP007', 
    name: 'Rina Fitria',
    initial: 'RF',
    division: 'Kepritogel',
    position: 'UI/UX Designer', 
    phone: '0815-6789-0123',
    joinDate: '2023-02-01',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Rina+Fitria&background=3b82f6&color=fff&size=40'
  },
  { 
    id: 'EMP008', 
    name: 'Dian Purnama',
    initial: 'DP',
    division: 'Hatoribet',
    position: 'DevOps', 
    phone: '0822-3456-7890',
    joinDate: '2020-05-10',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Dian+Purnama&background=16a34a&color=fff&size=40'
  },
  { 
    id: 'EMP009', 
    name: 'willy febrian',
    initial: 'WL',
    division: 'Livitoto',
    position: 'IT', 
    phone: '0812-3456-7890',
    joinDate: '2021-07-01',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=willy+febrian&background=8b5cf6&color=fff&size=40'
  },
  { 
    id: 'EMP010', 
    name: 'Ivan',
    initial: 'IV',
    division: 'Hmd29',
    position: 'asdaa', 
    phone: '0812-3456-7890',
    joinDate: '2022-03-08',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Ivan&background=3b82f6&color=fff&size=40'
  },
  { 
    id: 'EMP011', 
    name: 'Andi Pratama',
    initial: 'AP',
    division: 'Inatogel',
    position: 'Full Stack Developer', 
    phone: '0813-4567-8901',
    joinDate: '2023-07-15',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Andi+Pratama&background=16a34a&color=fff&size=40'
  },
  { 
    id: 'EMP012', 
    name: 'Sarah Febriani',
    initial: 'SF',
    division: 'Kepritogel',
    position: 'LiveChat', 
    phone: '0821-5678-9012',
    joinDate: '2022-09-20',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Sarah+Febriani&background=ea580c&color=fff&size=40'
  },
  { 
    id: 'EMP013', 
    name: 'Doni Saputra',
    initial: 'DS',
    division: 'Hatoribet',
    position: 'Seo', 
    phone: '0856-7890-1234',
    joinDate: '2021-12-01',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Doni+Saputra&background=8b5cf6&color=fff&size=40'
  },
  { 
    id: 'EMP014', 
    name: 'Linda Anggraini',
    initial: 'LA',
    division: 'Livitoto',
    position: 'LiveChat', 
    phone: '0811-2345-6789',
    joinDate: '2023-01-10',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Linda+Anggraini&background=dc2626&color=fff&size=40'
  },
  { 
    id: 'EMP015', 
    name: 'Fajar Nugroho',
    initial: 'FN',
    division: 'Hmd29',
    position: 'Seo', 
    phone: '0878-9012-3456',
    joinDate: '2022-05-25',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Fajar+Nugroho&background=3b82f6&color=fff&size=40'
  },
  { 
    id: 'EMP016', 
    name: 'Risa Amelia',
    initial: 'RA',
    division: 'Inatogel',
    position: 'LiveChat', 
    phone: '0813-5678-9012',
    joinDate: '2023-06-10',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Risa+Amelia&background=8b5cf6&color=fff&size=40'
  },
  { 
    id: 'EMP017', 
    name: 'Bima Sakti',
    initial: 'BS',
    division: 'Kepritogel',
    position: 'Seo', 
    phone: '0822-4567-8901',
    joinDate: '2023-08-01',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Bima+Sakti&background=dc2626&color=fff&size=40'
  },
  { 
    id: 'EMP018', 
    name: 'Cinta Dewi',
    initial: 'CD',
    division: 'Hatoribet',
    position: 'LiveChat', 
    phone: '0857-8901-2345',
    joinDate: '2023-09-15',
    status: 'Aktif',
    photo: 'https://ui-avatars.com/api/?name=Cinta+Dewi&background=16a34a&color=fff&size=40'
  },
];

let absensiLengkapData = [];
let izinData = [];

const employees = [
  { name: 'Rina Fitria', dept: 'Kepritogel', img: 'https://ui-avatars.com/api/?name=Rina+Fitria&background=3b82f6&color=fff&size=40' },
  { name: 'Dian Purnama', dept: 'Hatoribet', img: 'https://ui-avatars.com/api/?name=Dian+Purnama&background=16a34a&color=fff&size=40' },
  { name: 'Eko Nugroho', dept: 'Livitoto', img: 'https://ui-avatars.com/api/?name=Eko+Nugroho&background=ea580c&color=fff&size=40' },
  { name: 'Lia Anggraeni', dept: 'Hmd29', img: 'https://ui-avatars.com/api/?name=Lia+Anggraeni&background=8b5cf6&color=fff&size=40' },
  { name: 'Hendra Gunawan', dept: 'Inatogel', img: 'https://ui-avatars.com/api/?name=Hendra+Gunawan&background=dc2626&color=fff&size=40' },
  { name: 'willy febrian', dept: 'Livitoto', img: 'https://ui-avatars.com/api/?name=willy+febrian&background=8b5cf6&color=fff&size=40' },
];

let selectedKaryawanForIzin = null;
let izinMode = 'keluar';

// ========== FILTER KARYAWAN VARIABLES ==========
let filterSitus = '';
let filterPosisi = '';

// ========== SETTINGS DATA ==========
let situsList = ['Inatogel', 'Kepritogel', 'Hatoribet', 'Livitoto', 'Hmd29'];
let kategoriIzinList = ['Merokok', 'BAB', 'Kencin', 'Ambil Makan', 'Ambil Kopi'];
let bonusSettings = [
  { id: 1, persen: 10, minMenit: 41, maxMenit: 45, keterangan: 'Peringatan 10%' },
  { id: 2, persen: 20, minMenit: 46, maxMenit: 50, keterangan: 'Peringatan 20%' },
  { id: 3, persen: 30, minMenit: 51, maxMenit: 60, keterangan: 'Peringatan 30%' },
  { id: 4, persen: 100, minMenit: 61, maxMenit: 999, keterangan: 'PEMECATAN' }
];
let nextBonusId = 5;

function loadSettingsFromStorage() {
  const savedSitus = localStorage.getItem('settings_situs_list');
  if (savedSitus) {
    try {
      situsList = JSON.parse(savedSitus);
    } catch(e) {}
  }
  
  const savedKategori = localStorage.getItem('settings_kategori_izin');
  if (savedKategori) {
    try {
      kategoriIzinList = JSON.parse(savedKategori);
    } catch(e) {}
  }
  
  const savedBonus = localStorage.getItem('settings_bonus_list');
  if (savedBonus) {
    try {
      bonusSettings = JSON.parse(savedBonus);
      const maxId = Math.max(...bonusSettings.map(b => b.id), 0);
      nextBonusId = maxId + 1;
    } catch(e) {}
  }
}

function saveSettingsToStorage() {
  localStorage.setItem('settings_situs_list', JSON.stringify(situsList));
  localStorage.setItem('settings_kategori_izin', JSON.stringify(kategoriIzinList));
  localStorage.setItem('settings_bonus_list', JSON.stringify(bonusSettings));
}

loadSettingsFromStorage();

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDurasi(menit) {
  if (menit <= 0) return '0 menit';
  if (menit < 60) return `${menit} menit`;
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  if (sisaMenit === 0) return `${jam} jam`;
  return `${jam} jam ${sisaMenit} menit`;
}

function calculateDurasiIzin(jamIzin, jamKembali) {
  if (jamIzin === '-' || jamKembali === '-' || !jamIzin || !jamKembali) return 0;
  const [jamMulai, menitMulai] = jamIzin.split(':').map(Number);
  const [jamSelesai, menitSelesai] = jamKembali.split(':').map(Number);
  let totalMenit = (jamSelesai * 60 + menitSelesai) - (jamMulai * 60 + menitMulai);
  if (totalMenit < 0) totalMenit += 24 * 60;
  return totalMenit;
}

function calculateTotalJam(masuk, pulang) {
  if (masuk === '-' || pulang === '-' || !masuk || !pulang) return '-';
  const [jamMasuk, menitMasuk] = masuk.split(':').map(Number);
  const [jamPulang, menitPulang] = pulang.split(':').map(Number);
  let totalMenit = (jamPulang * 60 + menitPulang) - (jamMasuk * 60 + menitMasuk);
  if (totalMenit < 0) totalMenit += 24 * 60;
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;
  if (jam === 0 && menit === 0) return '-';
  if (jam === 0) return `${menit} menit`;
  if (menit === 0) return `${jam} jam`;
  return `${jam} jam ${menit} menit`;
}

function getStatusFromTime(masuk) {
  if (!masuk || masuk === '-') return 'Alpha';
  const [jam] = masuk.split(':').map(Number);
  if (jam <= 8) return 'Hadir';
  if (jam <= 9) return 'Terlambat';
  return 'Terlambat';
}

function calculateMasaKerja(joinDateStr) {
  const join = new Date(joinDateStr);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  let months = now.getMonth() - join.getMonth();
  let days = now.getDate() - join.getDate();
  
  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  let result = [];
  if (years > 0) result.push(`${years} tahun`);
  if (months > 0) result.push(`${months} bulan`);
  if (days > 0) result.push(`${days} hari`);
  
  return result.length > 0 ? result.join(' ') : 'Baru bergabung';
}

function getSisaWaktuIzin(namaStaff, tanggal) {
  const MAX_IZIN_PER_HARI = getKuotaIzinPerHari();
  
  const izinStaff = izinData.filter(item => 
    item.name === namaStaff && 
    item.date === tanggal && 
    item.status === 'Kembali' &&
    item.durasiIzin !== '-'
  );
  
  let totalDurasiMenit = 0;
  izinStaff.forEach(item => {
    const durasi = item.durasiIzin;
    if (durasi && durasi !== '-') {
      let menit = 0;
      const jamMatch = durasi.match(/(\d+)\s*jam/);
      const menitMatch = durasi.match(/(\d+)\s*menit/);
      
      if (jamMatch) menit += parseInt(jamMatch[1]) * 60;
      if (menitMatch) menit += parseInt(menitMatch[1]);
      
      if (!jamMatch && !menitMatch) {
        const angka = parseInt(durasi);
        if (!isNaN(angka)) menit = angka;
      }
      totalDurasiMenit += menit;
    }
  });
  
  const sisa = MAX_IZIN_PER_HARI - totalDurasiMenit;
  return sisa > 0 ? sisa : 0;
}

function getPemotonganBonus(totalDurasiMenit) {
  for (const bonus of bonusSettings) {
    if (totalDurasiMenit >= bonus.minMenit && totalDurasiMenit <= bonus.maxMenit) {
      return { 
        status: bonus.keterangan, 
        bonus: bonus.persen, 
        keterangan: `Pemotongan bonus ${bonus.persen}%` 
      };
    }
  }
  return { status: 'Normal', bonus: 0, keterangan: 'Tidak ada pemotongan' };
}

// ========== TELEGRAM NOTIFICATION FUNCTIONS ==========

function formatTelegramMessage(title, fields, footer = '') {
  let message = `📢 <b>${title}</b>\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  for (const [key, value] of Object.entries(fields)) {
    if (value && value !== '-') {
      message += `┃ ${key}: <b>${value}</b>\n`;
    }
  }
  
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (footer) {
    message += `\n${footer}`;
  }
  
  return message;
}

function formatTelegramIzinKeluarMessage(data) {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
    const date = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
    });
    
    let message = '';
    
    message += `HATORI GROUP\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `STAFF IZIN KELUAR\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    message += `Nama       : ${data.nama}\n`;
    message += `Tanggal    : ${date}\n`;
    message += `Situs      : ${data.situs}\n`;
    message += `Jabatan    : ${data.posisi}\n`;
    message += `Keterangan : ${data.keterangan}\n`;
    message += `Keluar     : ${time}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    return message;
}

function formatTelegramIzinKembaliMessage(data) {
    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
    const date = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta'
    });
    
    const maxKuota = getKuotaIzinPerHari();
    const today = getTodayDate();
    
    const semuaIzinHariIni = izinData.filter(item => 
        item.date === today && 
        item.name === data.nama
    );
    
    const riwayatIzinSelesai = semuaIzinHariIni.filter(item => 
        item.status === 'Kembali' &&
        item.durasiIzin && 
        item.durasiIzin !== '-'
    );
    
    riwayatIzinSelesai.sort((a, b) => a.jamIzin.localeCompare(b.jamIzin));
    
    let riwayatText = '';
    let totalDurasiMenit = 0;
    
    riwayatIzinSelesai.forEach((item, index) => {
        const nomor = index + 1;
        let durasiText = item.durasiIzin || '0 menit';
        if (durasiText === '-' || !durasiText) durasiText = '0 menit';
        riwayatText += `Keluar #${nomor} : ${durasiText}\n`;
        
        let menit = 0;
        const jamMatch = durasiText.match(/(\d+)\s*jam/);
        const menitMatch = durasiText.match(/(\d+)\s*menit/);
        if (jamMatch) menit += parseInt(jamMatch[1]) * 60;
        if (menitMatch) menit += parseInt(menitMatch[1]);
        if (!jamMatch && !menitMatch) {
            const angka = parseInt(durasiText);
            if (!isNaN(angka)) menit = angka;
        }
        totalDurasiMenit += menit;
    });
    
    const izinBaruSelesai = semuaIzinHariIni.filter(item => 
        item.status === 'Kembali' &&
        item.jamKembali === time &&
        item.jamIzin === data.jamIzin
    );
    
    if (izinBaruSelesai.length > 0) {
        const izinBaru = izinBaruSelesai[0];
        const sudahAda = riwayatIzinSelesai.some(item => 
            item.jamIzin === izinBaru.jamIzin && 
            item.jamKembali === izinBaru.jamKembali
        );
        
        if (!sudahAda) {
            const nomorBaru = riwayatIzinSelesai.length + 1;
            let durasiText = izinBaru.durasiIzin || '0 menit';
            if (durasiText === '-' || !durasiText) durasiText = '0 menit';
            riwayatText += `Keluar #${nomorBaru} : ${durasiText}\n`;
            
            let menit = 0;
            const jamMatch = durasiText.match(/(\d+)\s*jam/);
            const menitMatch = durasiText.match(/(\d+)\s*menit/);
            if (jamMatch) menit += parseInt(jamMatch[1]) * 60;
            if (menitMatch) menit += parseInt(menitMatch[1]);
            if (!jamMatch && !menitMatch) {
                const angka = parseInt(durasiText);
                if (!isNaN(angka)) menit = angka;
            }
            totalDurasiMenit += menit;
        }
    }
    
    if (!riwayatText) {
        let durasiText = data.durasi || '0 menit';
        if (durasiText === '-' || !durasiText) durasiText = '0 menit';
        riwayatText = `Keluar #1 : ${durasiText}\n`;
        
        let menit = 0;
        const jamMatch = durasiText.match(/(\d+)\s*jam/);
        const menitMatch = durasiText.match(/(\d+)\s*menit/);
        if (jamMatch) menit += parseInt(jamMatch[1]) * 60;
        if (menitMatch) menit += parseInt(menitMatch[1]);
        if (!jamMatch && !menitMatch) {
            const angka = parseInt(durasiText);
            if (!isNaN(angka)) menit = angka;
        }
        totalDurasiMenit = menit;
    }
    
    const sisaWaktu = Math.max(0, maxKuota - totalDurasiMenit);
    const sisaWaktuFormat = formatDurasi(sisaWaktu);
    
    let status = 'Aman ✅';
    if (sisaWaktu <= 0) {
        status = '⚠️ Sisa Waktu Telah Habis!';
    } else if (sisaWaktu <= 10) {
        status = '⚠️ Waktu Sisa sedikit!';
    }
    
    const totalIzinKeluar = riwayatIzinSelesai.length + (izinBaruSelesai.length > 0 && !riwayatIzinSelesai.some(item => 
        item.jamIzin === izinBaruSelesai[0].jamIzin && 
        item.jamKembali === izinBaruSelesai[0].jamKembali
    ) ? 1 : 0);
    
    let message = '';
    
    message += `HATORI GROUP\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `STAFF KEMBALI DARI IZIN\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    message += `Nama    : ${data.nama}\n`;
    message += `Tanggal : ${date}\n`;
    message += `Situs   : ${data.situs}\n`;
    message += `Keluar  : ${data.jamIzin}\n`;
    message += `Masuk   : ${time}\n`;
    let durasiText = data.durasi || '0 menit';
    if (durasiText === '-' || !durasiText) durasiText = '0 menit';
    message += `Durasi  : ${durasiText}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    message += `TOTAL IZIN HARI INI\n`;
    message += riwayatText;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    message += `Total   : ${totalIzinKeluar}\n`;
    message += `Sisa Waktu Izin : ${sisaWaktuFormat}\n`;
    message += `Status  : ${status}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    return message;
}

async function sendTelegramIzinKeluar(nama, situs, posisi, jam, keterangan, sisaKuota) {
    try {
        const config = JSON.parse(localStorage.getItem('hrpro_telegram_config') || '{}');
        
        if (!config.botToken || !config.chatId) {
            console.log('⚠️ Telegram config tidak lengkap, notifikasi tidak dikirim');
            return false;
        }
        
        if (config.autoNotify === 'none') {
            console.log('⚠️ Notifikasi Telegram dinonaktifkan');
            return false;
        }
        
        const data = {
            nama: nama,
            situs: situs,
            posisi: posisi,
            keterangan: keterangan
        };
        
        const message = formatTelegramIzinKeluarMessage(data);
        
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Notifikasi izin keluar terkirim ke Telegram');
            return true;
        } else {
            console.error('❌ Gagal kirim notifikasi:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Error kirim notifikasi:', error);
        return false;
    }
}

async function sendTelegramIzinKembali(nama, situs, posisi, jamIzin, jamKembali, durasi) {
    try {
        const config = JSON.parse(localStorage.getItem('hrpro_telegram_config') || '{}');
        
        if (!config.botToken || !config.chatId) {
            console.log('⚠️ Telegram config tidak lengkap, notifikasi tidak dikirim');
            return false;
        }
        
        if (config.autoNotify === 'none') {
            console.log('⚠️ Notifikasi Telegram dinonaktifkan');
            return false;
        }
        
        try {
            const savedIzin = localStorage.getItem('hrpro_izin_data');
            if (savedIzin) {
                const parsed = JSON.parse(savedIzin);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    izinData = parsed;
                    console.log('✅ Izin data refreshed from localStorage:', izinData.length, 'items');
                }
            }
        } catch(e) {
            console.error('Error refreshing izin data:', e);
        }
        
        const data = {
            nama: nama,
            situs: situs,
            posisi: posisi,
            jamIzin: jamIzin,
            jamKembali: jamKembali,
            durasi: durasi
        };
        
        const message = formatTelegramIzinKembaliMessage(data);
        
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Notifikasi izin kembali terkirim ke Telegram');
            return true;
        } else {
            console.error('❌ Gagal kirim notifikasi:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Error kirim notifikasi:', error);
        return false;
    }
}

window.sendTelegramIzinKeluar = sendTelegramIzinKeluar;
window.sendTelegramIzinKembali = sendTelegramIzinKembali;

// ========== UPDATE SITUS DROPDOWN ==========
function updateSitusDropdown() {
  const select = document.getElementById('inputDivisi');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '<option value="">Pilih Situs</option>';
  
  situsList.forEach(situs => {
    const option = document.createElement('option');
    option.value = situs;
    option.textContent = situs;
    select.appendChild(option);
  });
  
  if (situsList.includes(currentValue)) {
    select.value = currentValue;
  }
}

function updateFilterSitusDropdown() {
  const select = document.getElementById('filterSitus');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '<option value="">Semua Situs</option>';
  
  situsList.forEach(situs => {
    const option = document.createElement('option');
    option.value = situs;
    option.textContent = situs;
    select.appendChild(option);
  });
  
  if (situsList.includes(currentValue)) {
    select.value = currentValue;
  }
}

// ========== NAVIGATION WITH FILTER ==========
function navigateToWithFilter(page, situs, posisi) {
  // Cek permission terlebih dahulu
  if (page === 'karyawan' && !canViewMenu('karyawan')) {
    showToast('⚠️ Anda tidak memiliki izin untuk mengakses menu Karyawan!', 'error');
    return;
  }
  
  if (situs !== undefined && situs !== '') {
    localStorage.setItem('hrpro_filter_situs', situs);
  } else {
    localStorage.removeItem('hrpro_filter_situs');
  }
  if (posisi !== undefined && posisi !== '') {
    localStorage.setItem('hrpro_filter_posisi', posisi);
  } else {
    localStorage.removeItem('hrpro_filter_posisi');
  }
  
  localStorage.setItem('hrpro_last_page', page);
  window.location.href = page + '.html';
}

// ========== UPDATE DASHBOARD STATISTICS ==========
function updateDashboardStats() {
  const totalKaryawan = karyawanData.length;
  const totalEl = document.getElementById('totalKaryawan');
  if (totalEl) totalEl.textContent = totalKaryawan;
  
  const situsListArr = ['Inatogel', 'Kepritogel', 'Hatoribet', 'Livitoto', 'Hmd29'];
  situsListArr.forEach(situs => {
    const count = karyawanData.filter(item => item.division === situs).length;
    const el = document.getElementById('total' + situs);
    if (el) el.textContent = count;
  });
  
  const liveChatCount = karyawanData.filter(item => item.position === 'LiveChat').length;
  const liveChatEl = document.getElementById('totalLiveChat');
  if (liveChatEl) liveChatEl.textContent = liveChatCount;
  
  const seoCount = karyawanData.filter(item => item.position === 'Seo').length;
  const seoEl = document.getElementById('totalSeo');
  if (seoEl) seoEl.textContent = seoCount;
  
  console.log('📊 Dashboard stats updated:', {
    total: totalKaryawan,
    situs: situsListArr.map(s => ({ situs: s, count: karyawanData.filter(item => item.division === s).length })),
    liveChat: liveChatCount,
    seo: seoCount
  });
}

// ========== RENDER FUNCTIONS ==========

function renderAttendance() {
  const tbody = document.querySelector('#pageContainer #attendanceTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  attendanceData.forEach(item => {
    const tr = document.createElement('tr');
    let statusClass = item.status.toLowerCase();
    if (statusClass === 'hadir') statusClass = 'hadir';
    else if (statusClass === 'izin') statusClass = 'izin';
    else if (statusClass === 'alpha') statusClass = 'alpha';
    else if (statusClass === 'terlambat') statusClass = 'terlambat';

    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.division}</td>
      <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      <td>${item.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ========== RENDER KARYAWAN ==========
function renderKaryawanHeader() {
  const thead = document.querySelector('#karyawanTableHead');
  if (!thead) {
    console.warn('Element #karyawanTableHead tidak ditemukan!');
    return;
  }
  
  const defaultColumns = ['ID', 'Foto', 'Nama', 'Inisial', 'Situs', 'Posisi', 'Telepon', 'Tanggal Join', 'Masa Kerja', 'Status', 'Aksi'];
  let columnsToShow = defaultColumns;
  
  const savedColumns = localStorage.getItem('settings_karyawan_columns');
  
  if (savedColumns) {
    try {
      const parsed = JSON.parse(savedColumns);
      if (Array.isArray(parsed) && parsed.length > 0) {
        columnsToShow = parsed;
      }
      else if (Array.isArray(parsed) && parsed.length === 0) {
        columnsToShow = defaultColumns;
        localStorage.setItem('settings_karyawan_columns', JSON.stringify(defaultColumns));
      }
    } catch(e) {
      console.error('Error parsing saved columns:', e);
      columnsToShow = defaultColumns;
    }
  }
  
  if (!columnsToShow || columnsToShow.length === 0) {
    columnsToShow = defaultColumns;
  }
  
  let headerHtml = '<tr>';
  columnsToShow.forEach(col => {
    headerHtml += `<th>${col}</th>`;
  });
  headerHtml += '</tr>';
  
  thead.innerHTML = headerHtml;
}

function renderKaryawan(filter = '') {
  renderKaryawanHeader();
  
  const tbody = document.querySelector('#karyawanTableBody');
  if (!tbody) {
    console.warn('Element #karyawanTableBody tidak ditemukan!');
    return;
  }
  tbody.innerHTML = '';
  
  const defaultColumns = ['ID', 'Foto', 'Nama', 'Inisial', 'Situs', 'Posisi', 'Telepon', 'Tanggal Join', 'Masa Kerja', 'Status', 'Aksi'];
  let columnsToShow = defaultColumns;
  
  const savedColumns = localStorage.getItem('settings_karyawan_columns');
  if (savedColumns) {
    try {
      const parsed = JSON.parse(savedColumns);
      if (Array.isArray(parsed) && parsed.length > 0) {
        columnsToShow = parsed;
      } else if (Array.isArray(parsed) && parsed.length === 0) {
        columnsToShow = defaultColumns;
        localStorage.setItem('settings_karyawan_columns', JSON.stringify(defaultColumns));
      }
    } catch(e) {}
  }
  
  if (!columnsToShow || columnsToShow.length === 0) {
    columnsToShow = defaultColumns;
  }
  
  const filterSitus = localStorage.getItem('hrpro_filter_situs') || window.filterSitus || '';
  const filterPosisi = localStorage.getItem('hrpro_filter_posisi') || window.filterPosisi || '';
  
  console.log('🔍 FILTER YANG DIGUNAKAN:', { filterSitus, filterPosisi });
  console.log('📊 TOTAL DATA KARYAWAN:', karyawanData.length);
  
  let filteredData = karyawanData.filter(item => {
    const searchMatch = filter === '' || 
      item.name.toLowerCase().includes(filter.toLowerCase()) ||
      item.id.toLowerCase().includes(filter.toLowerCase()) ||
      item.initial.toLowerCase().includes(filter.toLowerCase()) ||
      item.division.toLowerCase().includes(filter.toLowerCase()) ||
      item.position.toLowerCase().includes(filter.toLowerCase());
    
    let situsMatch = true;
    if (filterSitus && filterSitus !== '') {
      situsMatch = item.division === filterSitus;
    }
    
    let posisiMatch = true;
    if (filterPosisi && filterPosisi !== '') {
      posisiMatch = item.position === filterPosisi;
    }
    
    return searchMatch && situsMatch && posisiMatch;
  });
  
  console.log(`📊 HASIL FILTER: ${filteredData.length} dari ${karyawanData.length} data`);
  
  filteredData.sort((a, b) => {
    const dateA = new Date(a.joinDate);
    const dateB = new Date(b.joinDate);
    return dateA - dateB;
  });
  
  // Cek permission untuk aksi
  const hasEdit = hasPermission('edit');
  const hasDelete = hasPermission('delete');
  
  if (filteredData.length === 0) {
    const colspan = columnsToShow.length;
    let filterInfo = '';
    if (filterSitus) filterInfo += ` Situs: "${filterSitus}"`;
    if (filterPosisi) filterInfo += ` Posisi: "${filterPosisi}"`;
    tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-search" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
      Tidak ada karyawan ditemukan${filterInfo ? ' dengan filter' : ''}
      ${filterInfo ? '<br><span style="font-size: 12px; color: rgba(255,255,255,0.2);">' + filterInfo + '</span>' : ''}
    </td></tr>`;
    return;
  }
  
  filteredData.forEach((item, index) => {
    const tr = document.createElement('tr');
    const statusClass = item.status === 'Aktif' ? 'hadir' : 'izin';
    const originalIndex = karyawanData.indexOf(item);
    
    let rowHtml = '';
    
    columnsToShow.forEach(col => {
      switch(col) {
        case 'ID':
          rowHtml += `<td><strong>${item.id}</strong></td>`;
          break;
        case 'Foto':
          rowHtml += `<td><img src="${item.photo}" alt="${item.name}" class="avatar-thumb" data-index="${originalIndex}" onclick="openPhotoPreview(${originalIndex})"></td>`;
          break;
        case 'Nama':
          rowHtml += `<td>${item.name}</td>`;
          break;
        case 'Inisial':
          rowHtml += `<td><strong>${item.initial}</strong></td>`;
          break;
        case 'Situs':
          rowHtml += `<td>${item.division}</td>`;
          break;
        case 'Posisi':
          rowHtml += `<td>${item.position}</td>`;
          break;
        case 'Telepon':
          rowHtml += `<td>${item.phone}</td>`;
          break;
        case 'Tanggal Join':
          rowHtml += `<td>${formatDate(item.joinDate)}</td>`;
          break;
        case 'Masa Kerja':
          rowHtml += `<td>${calculateMasaKerja(item.joinDate)}</td>`;
          break;
        case 'Status':
          rowHtml += `<td><span class="status-badge ${statusClass}">${item.status}</span></td>`;
          break;
        case 'Aksi':
          rowHtml += `<td>`;
          if (hasEdit) {
            rowHtml += `<button class="btn-action edit" onclick="editKaryawan(${originalIndex})"><i class="fas fa-edit"></i></button>`;
          }
          if (hasDelete) {
            rowHtml += `<button class="btn-action delete" onclick="deleteKaryawan(${originalIndex})"><i class="fas fa-trash"></i></button>`;
          }
          rowHtml += `</td>`;
          break;
        default:
          break;
      }
    });
    
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });
  
  applyPermissionsToActions();
}

function renderAbsensiLengkap() {
  const tbody = document.querySelector('#pageContainer #absensiTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (absensiLengkapData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-calendar" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
      Belum ada data absensi. Silakan klik "Masuk Bekerja" untuk memulai.
    </td></tr>`;
    return;
  }
  
  const sortedData = [...absensiLengkapData].sort((a, b) => b.date.localeCompare(a.date));
  
  sortedData.forEach(item => {
    const tr = document.createElement('tr');
    let statusClass = item.status.toLowerCase();
    if (statusClass === 'hadir') statusClass = 'hadir';
    else if (statusClass === 'izin') statusClass = 'izin';
    else if (statusClass === 'alpha') statusClass = 'alpha';
    else if (statusClass === 'terlambat') statusClass = 'terlambat';

    tr.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.division}</td>
      <td>${item.position}</td>
      <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      <td>${item.masuk}</td>
      <td>${item.pulang}</td>
      <td><strong>${item.totalJam}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// ========== RENDER IZIN STAFF ==========
function renderIzinStaff() {
  const tbody = document.querySelector('#pageContainer #izinTableBody');
  if (!tbody) {
    const altTbody = document.querySelector('#izinTableBody');
    if (altTbody) {
      renderIzinStaffToTbody(altTbody);
    }
    return;
  }
  renderIzinStaffToTbody(tbody);
}

function renderIzinStaffToTbody(tbody) {
  if (!tbody) return;
  tbody.innerHTML = '';
  
  console.log('📊 Rendering izin staff, data length:', izinData.length);
  
  if (izinData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-file-alt" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
      Belum ada data izin. Silakan klik "Izin Keluar" untuk memulai.
    </td></tr>`;
    return;
  }
  
  const sortedData = [...izinData].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.jamIzin.localeCompare(a.jamIzin);
  });
  
  sortedData.forEach((item) => {
    const tr = document.createElement('tr');
    let statusClass = item.status === 'Izin Keluar' ? 'izin-keluar' : 'kembali';
    
    const sisaMenit = getSisaWaktuIzin(item.name, item.date);
    const sisaWaktu = formatDurasi(sisaMenit);

    tr.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td><strong>${item.name}</strong></td>
      <td><strong>${item.initial}</strong></td>
      <td>${item.division}</td>
      <td>${item.position}</td>
      <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      <td>${item.jamIzin}</td>
      <td>${item.keterangan}</td>
      <td>${item.jamKembali}</td>
      <td><strong>${item.durasiIzin}</strong></td>
      <td><span class="status-badge ${sisaMenit > 10 ? 'hadir' : 'izin'}">${sisaWaktu}</span></td>
    `;
    tbody.appendChild(tr);
  });
  
  updateTotalIzinAktif();
  
  console.log('✅ Izin staff rendered:', sortedData.length, 'rows');
}

function renderEmployeeGrid() {
  const grid = document.querySelector('#pageContainer #employeeGrid');
  if (!grid) return;
  grid.innerHTML = '';
  employees.forEach(emp => {
    const div = document.createElement('div');
    div.className = 'employee-item';
    div.innerHTML = `
      <img src="${emp.img}" alt="${emp.name}">
      <div>
        <span class="name">${emp.name}</span>
        <span class="dept">${emp.dept}</span>
      </div>
    `;
    grid.appendChild(div);
  });
}

// ========== RENDER HISTORY IZIN HARI INI (DASHBOARD) ==========
function renderHistoryIzinHariIni() {
  let tbody = document.getElementById('historyIzinTableBody');
  
  if (!tbody) {
    tbody = document.querySelector('#pageContainer #historyIzinTableBody');
  }
  
  if (!tbody) {
    const allTbody = document.querySelectorAll('tbody');
    for (let el of allTbody) {
      if (el.id === 'historyIzinTableBody') {
        tbody = el;
        break;
      }
      const parent = el.closest('section, div, .table-card');
      if (parent) {
        const header = parent.querySelector('.card-header h3');
        if (header && header.textContent.includes('History Izin Staff')) {
          tbody = el;
          break;
        }
      }
    }
  }
  
  if (!tbody) {
    console.warn('❌ Element #historyIzinTableBody tidak ditemukan!');
    return;
  }
  
  tbody.innerHTML = '';
  
  const today = getTodayDate();
  
  let todayIzin = izinData.filter(item => item.date === today);
  todayIzin = todayIzin.sort((a, b) => {
    return b.jamIzin.localeCompare(a.jamIzin);
  });
  todayIzin = todayIzin.slice(0, 10);
  
  if (todayIzin.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-clock" style="font-size: 20px; display: block; margin-bottom: 6px;"></i>
      Belum ada izin staff hari ini
    </td></tr>`;
    return;
  }
  
  todayIzin.forEach(item => {
    const tr = document.createElement('tr');
    let statusClass = item.status === 'Izin Keluar' ? 'izin-keluar' : 'kembali';
    
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.division}</td>
      <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      <td>${item.jamIzin}</td>
      <td>${item.keterangan}</td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log('✅ History izin hari ini rendered:', todayIzin.length, 'rows');
}

// ========== RENDER DATA KARYAWAN (DASHBOARD) ==========
function renderDataKaryawan() {
  let tbody = document.getElementById('dataKaryawanTableBody');
  
  if (!tbody) {
    tbody = document.querySelector('#pageContainer #dataKaryawanTableBody');
  }
  
  if (!tbody) {
    const allTbody = document.querySelectorAll('tbody');
    for (let el of allTbody) {
      if (el.id === 'dataKaryawanTableBody') {
        tbody = el;
        break;
      }
      const parent = el.closest('section, div, .chart-card');
      if (parent) {
        const header = parent.querySelector('.card-header h3');
        if (header && header.textContent.includes('Data Karyawan')) {
          tbody = el;
          break;
        }
      }
    }
  }
  
  if (!tbody) {
    console.warn('❌ Element #dataKaryawanTableBody tidak ditemukan!');
    return;
  }
  
  tbody.innerHTML = '';
  
  let sortedData = karyawanData
    .filter(item => item.status === 'Aktif')
    .sort((a, b) => {
      const dateA = new Date(a.joinDate);
      const dateB = new Date(b.joinDate);
      return dateA - dateB;
    });
  
  sortedData = sortedData.slice(0, 50);
  
  if (sortedData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-users" style="font-size: 20px; display: block; margin-bottom: 6px;"></i>
      Belum ada data karyawan
    </td></tr>`;
    return;
  }
  
  sortedData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td><strong>${item.initial}</strong></td>
      <td>${item.division}</td>
      <td>${item.position}</td>
      <td>${formatDate(item.joinDate)}</td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log('✅ Data karyawan rendered:', sortedData.length, 'rows');
}

function renderHistoryIzinHariIniToTbody(tbody) {
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const today = getTodayDate();
  
  const todayIzin = izinData
    .filter(item => item.date === today)
    .sort((a, b) => {
      return b.jamIzin.localeCompare(a.jamIzin);
    });
  
  if (todayIzin.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-clock" style="font-size: 20px; display: block; margin-bottom: 6px;"></i>
      Belum ada izin staff hari ini
    </td></tr>`;
    return;
  }
  
  todayIzin.forEach(item => {
    const tr = document.createElement('tr');
    let statusClass = item.status === 'Izin Keluar' ? 'izin-keluar' : 'kembali';
    
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.division}</td>
      <td><span class="status-badge ${statusClass}">${item.status}</span></td>
      <td>${item.jamIzin}</td>
      <td>${item.keterangan}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDataKaryawanToTbody(tbody) {
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const sortedData = [...karyawanData]
    .filter(item => item.status === 'Aktif')
    .sort((a, b) => {
      const dateA = new Date(a.joinDate);
      const dateB = new Date(b.joinDate);
      return dateA - dateB;
    });
  
  if (sortedData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-users" style="font-size: 20px; display: block; margin-bottom: 6px;"></i>
      Belum ada data karyawan
    </td></tr>`;
    return;
  }
  
  sortedData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td><strong>${item.initial}</strong></td>
      <td>${item.division}</td>
      <td>${item.position}</td>
      <td>${formatDate(item.joinDate)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ========== CHART ==========
let chartInstance = null;

function initChart() {
  const canvas = document.querySelector('#pageContainer #attendanceChart');
  if (!canvas) return;
  
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
      datasets: [
        {
          label: 'Hadir',
          data: [42, 48, 45, 40],
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: 'Izin',
          data: [8, 5, 9, 6],
          backgroundColor: '#facc15',
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: 'Alpha',
          data: [4, 3, 5, 8],
          backgroundColor: '#ef4444',
          borderRadius: 6,
          barPercentage: 0.6,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0f172a', cornerRadius: 10, titleFont: { weight: '500' } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 10, color: 'rgba(255,255,255,0.5)' } },
        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
      }
    }
  });
}

// ========== KARYAWAN FUNCTIONS ==========
window.openPhotoPreview = function(index) {
  const data = karyawanData[index];
  const previewImg = document.getElementById('previewFotoLarge');
  const previewName = document.getElementById('previewNamaKaryawan');
  if (previewImg) previewImg.src = data.photo;
  if (previewName) previewName.textContent = `${data.name} (${data.id})`;
  document.getElementById('modalPreviewFoto').classList.add('active');
};

function closePhotoPreview() {
  document.getElementById('modalPreviewFoto').classList.remove('active');
}

let editingIndex = null;
let uploadedPhoto = null;

function generateID() {
  const count = karyawanData.length + 1;
  return `EMP${String(count).padStart(3, '0')}`;
}

function openModal(editIndex = null) {
  // Cek permission create/edit
  if (editIndex !== null && !hasPermission('edit')) {
    showToast('⚠️ Anda tidak memiliki izin untuk mengedit karyawan!', 'error');
    return;
  }
  if (editIndex === null && !hasPermission('create')) {
    showToast('⚠️ Anda tidak memiliki izin untuk menambah karyawan!', 'error');
    return;
  }
  
  const modal = document.getElementById('modalTambahKaryawan');
  modal.classList.add('active');
  
  updateSitusDropdown();
  
  if (editIndex !== null) {
    const data = karyawanData[editIndex];
    document.getElementById('inputID').value = data.id;
    document.getElementById('inputInisial').value = data.initial;
    document.getElementById('inputNama').value = data.name;
    document.getElementById('inputDivisi').value = data.division;
    document.getElementById('inputPosisi').value = data.position;
    document.getElementById('inputTelepon').value = data.phone;
    document.getElementById('inputTanggalJoin').value = data.joinDate;
    document.getElementById('inputStatus').value = data.status;
    document.getElementById('photoPreview').src = data.photo;
    editingIndex = editIndex;
    document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-user-edit" style="color: #3b82f6;"></i> Edit Karyawan';
    document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> Update Karyawan';
  } else {
    document.getElementById('formTambahKaryawan').reset();
    document.getElementById('inputID').value = generateID();
    document.getElementById('photoPreview').src = 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=80';
    editingIndex = null;
    uploadedPhoto = null;
    document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-user-plus" style="color: #3b82f6;"></i> Tambah Karyawan Baru';
    document.querySelector('.btn-submit').innerHTML = '<i class="fas fa-save"></i> Simpan Karyawan';
  }
}

function closeModal() {
  document.getElementById('modalTambahKaryawan').classList.remove('active');
  editingIndex = null;
  uploadedPhoto = null;
}

window.editKaryawan = function(index) {
  if (!hasPermission('edit')) {
    showToast('⚠️ Anda tidak memiliki izin untuk mengedit!', 'error');
    return;
  }
  openModal(index);
};

window.deleteKaryawan = async function(index) {
  if (!hasPermission('delete')) {
    showToast('⚠️ Anda tidak memiliki izin untuk menghapus!', 'error');
    return;
  }
  
  const deletedId = karyawanData[index].id;
  karyawanData.splice(index, 1);
  
  if (USE_DATABASE && window.db && typeof window.db.deleteKaryawan === 'function') {
    try {
      await window.db.deleteKaryawan(deletedId);
      console.log('✅ Karyawan deleted from database:', deletedId);
    } catch(e) {
      console.error('Error deleting from database:', e);
    }
  }
  
  // Simpan ke localStorage
  localStorage.setItem('hrpro_karyawan_data', JSON.stringify(karyawanData));
  
  renderKaryawan(document.getElementById('searchInput')?.value || '');
  renderDataKaryawan();
  updateTotalKaryawan();
  updateDashboardStats();
  updatePosisiDropdown();
};

function updateTotalKaryawan() {
  const el = document.getElementById('totalKaryawan');
  if (el) el.textContent = karyawanData.filter(item => item.status === 'Aktif').length.toLocaleString();
}

function setupKaryawanEvents() {
  const btnTambah = document.getElementById('btnTambahKaryawan');
  if (btnTambah) {
    const newBtn = btnTambah.cloneNode(true);
    btnTambah.parentNode.replaceChild(newBtn, btnTambah);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!hasPermission('create')) {
        showToast('⚠️ Anda tidak memiliki izin untuk menambah karyawan!', 'error');
        return;
      }
      openModal();
    });
  }

  const form = document.getElementById('formTambahKaryawan');
  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const id = document.getElementById('inputID').value.trim();
      const initial = document.getElementById('inputInisial').value.trim().toUpperCase();
      const name = document.getElementById('inputNama').value.trim();
      const division = document.getElementById('inputDivisi').value;
      const position = document.getElementById('inputPosisi').value.trim();
      const phone = document.getElementById('inputTelepon').value.trim();
      const joinDate = document.getElementById('inputTanggalJoin').value;
      const status = document.getElementById('inputStatus').value;
      const photo = document.getElementById('photoPreview').src;

      if (!id || !name || !division || !position || !phone || !joinDate || !initial) {
        showToast('⚠️ Harap isi semua field yang wajib!', 'error');
        return;
      }

      if (editingIndex === null) {
        const existing = karyawanData.find(item => item.id === id);
        if (existing) {
          showToast('⚠️ ID Karyawan sudah digunakan!', 'error');
          return;
        }
      } else {
        const existing = karyawanData.find((item, index) => item.id === id && index !== editingIndex);
        if (existing) {
          showToast('⚠️ ID Karyawan sudah digunakan!', 'error');
          return;
        }
      }

      let newEmployee;
      if (editingIndex !== null) {
        karyawanData[editingIndex] = {
          ...karyawanData[editingIndex],
          id,
          name,
          initial,
          division,
          position,
          phone,
          joinDate,
          status,
          photo: uploadedPhoto || photo
        };
        newEmployee = karyawanData[editingIndex];
      } else {
        newEmployee = {
          id,
          name,
          initial,
          division,
          position,
          phone,
          joinDate,
          status,
          photo: uploadedPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=40`
        };
        karyawanData.push(newEmployee);
      }

      if (USE_DATABASE && window.db && typeof window.db.saveKaryawan === 'function') {
        try {
          await window.db.saveKaryawan(newEmployee);
          console.log('✅ Karyawan saved to database:', id);
        } catch(e) {
          console.error('Error saving to database:', e);
        }
      }
      
      // Simpan ke localStorage
      localStorage.setItem('hrpro_karyawan_data', JSON.stringify(karyawanData));

      renderKaryawan(document.getElementById('searchInput')?.value || '');
      renderDataKaryawan();
      updateTotalKaryawan();
      updateDashboardStats();
      updatePosisiDropdown();
      closeModal();
      showToast('✅ Data karyawan berhasil disimpan!', 'success');
    });
  }

  const btnUpload = document.getElementById('btnUploadPhoto');
  if (btnUpload) {
    btnUpload.addEventListener('click', function() {
      document.getElementById('photoInput').click();
    });
  }

  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          document.getElementById('photoPreview').src = event.target.result;
          uploadedPhoto = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  const cancelModalBtn = document.getElementById('btnCancelModal');
  if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', closeModal);
  }

  const closePreview = document.getElementById('closePreviewModal');
  if (closePreview) {
    closePreview.addEventListener('click', closePhotoPreview);
  }

  const closePreviewBtn = document.getElementById('closePreviewBtn');
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', closePhotoPreview);
  }

  const previewModal = document.getElementById('modalPreviewFoto');
  if (previewModal) {
    previewModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closePhotoPreview();
      }
    });
  }
}

// ========== FILTER KARYAWAN FUNCTIONS ==========
function setupFilterKaryawanEvents() {
  const btnFilter = document.getElementById('btnFilterKaryawan');
  if (btnFilter) {
    const newBtn = btnFilter.cloneNode(true);
    btnFilter.parentNode.replaceChild(newBtn, btnFilter);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openFilterModal();
    });
  }

  const formFilter = document.getElementById('formFilterKaryawan');
  if (formFilter) {
    formFilter.addEventListener('submit', function(e) {
      e.preventDefault();
      applyFilter();
    });
  }

  const cancelFilterBtn = document.getElementById('cancelFilterBtn');
  if (cancelFilterBtn) {
    cancelFilterBtn.addEventListener('click', function(e) {
      e.preventDefault();
      resetFilter();
    });
  }

  const closeFilterModal = document.getElementById('closeFilterModal');
  if (closeFilterModal) {
    closeFilterModal.addEventListener('click', function() {
      document.getElementById('modalFilterKaryawan').classList.remove('active');
    });
  }

  const modalFilter = document.getElementById('modalFilterKaryawan');
  if (modalFilter) {
    modalFilter.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  }
}

function openFilterModal() {
  const modal = document.getElementById('modalFilterKaryawan');
  modal.classList.add('active');
  updatePosisiDropdown();
  updateFilterSitusDropdown();
  
  const situsSelect = document.getElementById('filterSitus');
  const posisiSelect = document.getElementById('filterPosisi');
  
  const savedSitus = localStorage.getItem('hrpro_filter_situs');
  const savedPosisi = localStorage.getItem('hrpro_filter_posisi');
  
  if (savedSitus) {
    situsSelect.value = savedSitus;
    filterSitus = savedSitus;
  } else if (filterSitus) {
    situsSelect.value = filterSitus;
  }
  
  if (savedPosisi) {
    posisiSelect.value = savedPosisi;
    filterPosisi = savedPosisi;
  } else if (filterPosisi) {
    posisiSelect.value = filterPosisi;
  }
}

function updatePosisiDropdown() {
  const select = document.getElementById('filterPosisi');
  if (!select) return;
  
  const posisiList = [...new Set(karyawanData.map(item => item.position))].filter(p => p);
  posisiList.sort();
  
  const currentValue = select.value;
  select.innerHTML = '<option value="">Semua Posisi</option>';
  
  posisiList.forEach(posisi => {
    const option = document.createElement('option');
    option.value = posisi;
    option.textContent = posisi;
    select.appendChild(option);
  });
  
  const savedPosisi = localStorage.getItem('hrpro_filter_posisi');
  if (savedPosisi && posisiList.includes(savedPosisi)) {
    select.value = savedPosisi;
  } else if (currentValue && posisiList.includes(currentValue)) {
    select.value = currentValue;
  }
}

function loadFilterFromStorage() {
  const situs = localStorage.getItem('hrpro_filter_situs');
  const posisi = localStorage.getItem('hrpro_filter_posisi');
  
  if (situs !== null && situs !== '') {
    filterSitus = situs;
    const filterSitusEl = document.getElementById('filterSitus');
    if (filterSitusEl) filterSitusEl.value = situs;
  }
  
  if (posisi !== null && posisi !== '') {
    filterPosisi = posisi;
    const filterPosisiEl = document.getElementById('filterPosisi');
    if (filterPosisiEl) filterPosisiEl.value = posisi;
  }
}

function applyFilter() {
  filterSitus = document.getElementById('filterSitus').value;
  filterPosisi = document.getElementById('filterPosisi').value;
  document.getElementById('modalFilterKaryawan').classList.remove('active');
  renderKaryawan(document.getElementById('searchInput')?.value || '');
}

function resetFilter() {
  filterSitus = '';
  filterPosisi = '';
  document.getElementById('filterSitus').value = '';
  document.getElementById('filterPosisi').value = '';
  document.getElementById('modalFilterKaryawan').classList.remove('active');
  localStorage.removeItem('hrpro_filter_situs');
  localStorage.removeItem('hrpro_filter_posisi');
  renderKaryawan(document.getElementById('searchInput')?.value || '');
}

// ========== IZIN FUNCTIONS ==========
function openPilihKaryawanIzin(mode) {
  izinMode = mode;
  const modal = document.getElementById('modalPilihKaryawanIzin');
  const title = document.getElementById('modalIzinTitle');
  
  const currentUser = getCurrentLoggedInUser();
  const userRole = currentUser ? currentUser.role : 'Superadmin';
  const userName = currentUser ? (currentUser.name || currentUser.email) : '';
  
  let titleText = '';
  if (mode === 'keluar') {
    titleText = '<i class="fas fa-sign-out-alt" style="color: #ea580c;"></i> Pilih Karyawan - Izin Keluar';
  } else {
    titleText = '<i class="fas fa-sign-in-alt" style="color: #3b82f6;"></i> Pilih Karyawan - Sudah Kembali';
  }
  
  if (userRole === 'User') {
    titleText += ` <span style="font-size: 12px; color: #facc15; font-weight: 400; display: block; margin-top: 4px;">👤 Anda hanya bisa mengajukan izin untuk akun Anda sendiri</span>`;
  }
  
  title.innerHTML = titleText;
  
  modal.classList.add('active');
  renderDaftarKaryawanIzin('');
  const searchInput = document.getElementById('searchKaryawanIzin');
  if (searchInput) searchInput.value = '';
}

function renderDaftarKaryawanIzin(filter = '') {
  const container = document.getElementById('daftarKaryawanIzin');
  if (!container) return;
  container.innerHTML = '';
  
  const currentUser = getCurrentLoggedInUser();
  const userRole = currentUser ? currentUser.role : 'Superadmin';
  const userName = currentUser ? (currentUser.name || currentUser.email) : '';
  
  let filtered = karyawanData.filter(item => 
    item.status === 'Aktif' &&
    item.name.toLowerCase().includes(filter.toLowerCase())
  );
  
  if (userRole === 'User') {
    filtered = filtered.filter(item => 
      item.name.toLowerCase() === userName.toLowerCase()
    );
  }
  
  if (filtered.length === 0) {
    let message = 'Tidak ada karyawan aktif ditemukan';
    if (userRole === 'User') {
      message = 'Anda hanya dapat mengajukan izin untuk nama Anda sendiri.';
    }
    container.innerHTML = `<p style="text-align: center; color: rgba(255,255,255,0.4); padding: 20px;">${message}</p>`;
    return;
  }
  
  filtered.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'karyawan-item-izin';
    
    const today = getTodayDate();
    const existing = izinData.find(a => 
      a.date === today && a.name === item.name && a.status === 'Izin Keluar'
    );
    
    let statusText = 'Tidak izin';
    let statusClass = 'belum';
    if (existing) {
      if (existing.jamKembali && existing.jamKembali !== '-') {
        statusText = 'Sudah kembali';
        statusClass = 'kembali';
      } else {
        statusText = 'Izin keluar';
        statusClass = 'izin';
      }
    }
    
    const canSelect = canSelectEmployee(item.name);
    const isCurrentUser = item.name.toLowerCase() === userName.toLowerCase();
    
    let selectDisabled = false;
    
    if (!canSelect) {
      selectDisabled = true;
    }
    
    div.innerHTML = `
      <img src="${item.photo}" alt="${item.name}">
      <div class="info">
        <div class="name">${item.name} ${isCurrentUser ? '👤' : ''}</div>
        <div class="detail">${item.id} · ${item.division}</div>
      </div>
      <span class="status-now ${statusClass}">${statusText}</span>
      ${!canSelect ? `<span class="status-now" style="background: rgba(220,38,38,0.2); color: #f87171; font-size: 10px; padding: 2px 8px;">Tidak Tersedia</span>` : ''}
    `;
    
    div.addEventListener('click', function() {
      if (selectDisabled) {
        showToast('⚠️ Silahkan Pilih Nama Anda Sendiri!', 'error');
        return;
      }
      
      if (izinMode === 'keluar') {
        const todayDate = getTodayDate();
        const existingIzin = izinData.find(a => 
          a.date === todayDate && a.name === item.name && a.status === 'Izin Keluar'
        );
        if (existingIzin) {
          showToast('⚠️ ' + item.name + ' sedang dalam izin keluar!', 'warning');
          return;
        }
        
        const sisa = getSisaWaktuIzin(item.name, todayDate);
        if (sisa <= 0) {
          showToast('⚠️ Kuota izin ' + item.name + ' sudah habis hari ini!', 'warning');
          return;
        }
        
        selectedKaryawanForIzin = item;
        document.getElementById('modalPilihKaryawanIzin').classList.remove('active');
        openSubmitIzin(item);
      } else {
        const todayDate = getTodayDate();
        const existingIzin = izinData.find(a => 
          a.date === todayDate && a.name === item.name && a.status === 'Izin Keluar'
        );
        if (!existingIzin) {
          showToast('⚠️ ' + item.name + ' tidak sedang izin keluar!', 'warning');
          return;
        }
        if (existingIzin.jamKembali && existingIzin.jamKembali !== '-') {
          showToast('⚠️ ' + item.name + ' sudah kembali!', 'warning');
          return;
        }
        prosesKembali(item, existingIzin);
      }
    });
    
    if (selectDisabled) {
      div.style.opacity = '0.6';
      div.style.cursor = 'not-allowed';
    }
    
    container.appendChild(div);
  });
}

function openSubmitIzin(karyawan) {
  const modal = document.getElementById('modalSubmitIzin');
  document.getElementById('izinNamaKaryawan').textContent = karyawan.name;
  document.getElementById('izinInisialKaryawan').textContent = karyawan.initial;
  document.getElementById('izinJamKeluar').textContent = getCurrentTime();
  
  const select = document.getElementById('inputKeteranganIzin');
  select.innerHTML = '<option value="">Pilih Keterangan</option>';
  kategoriIzinList.forEach(kategori => {
    const option = document.createElement('option');
    option.value = kategori;
    option.textContent = kategori;
    select.appendChild(option);
  });
  
  modal.classList.add('active');
}

async function prosesKembali(karyawan, existingIzin) {
  const time = getCurrentTime();
  const index = izinData.indexOf(existingIzin);
  const durasiMenit = calculateDurasiIzin(existingIzin.jamIzin, time);
  const durasiFormat = formatDurasi(durasiMenit);
  
  const updatedIzin = {
    ...existingIzin,
    status: 'Kembali',
    jamKembali: time,
    durasiIzin: durasiFormat
  };
  
  izinData[index] = updatedIzin;
  
  console.log('📝 Updated izin data:', updatedIzin);
  
  // SIMPAN KE DATABASE
  if (USE_DATABASE && window.db && typeof window.db.saveIzin === 'function') {
    try {
      await window.db.saveIzin(updatedIzin);
      console.log('✅ Izin updated in database');
    } catch(e) {
      console.error('Error saving izin to database:', e);
    }
  }
  
  // Simpan ke localStorage
  try {
    localStorage.setItem('hrpro_izin_data', JSON.stringify(izinData));
    console.log('✅ Izin saved to localStorage');
  } catch(e) {
    console.error('Error saving izin to localStorage:', e);
  }
  
  // Refresh data
  try {
    const savedIzin = localStorage.getItem('hrpro_izin_data');
    if (savedIzin) {
      const parsed = JSON.parse(savedIzin);
      if (Array.isArray(parsed) && parsed.length > 0) {
        izinData = parsed;
        console.log('✅ Izin data refreshed:', izinData.length, 'items');
      }
    }
  } catch(e) {
    console.error('Error refreshing izin data:', e);
  }
  
  // Kirim notifikasi Telegram
  try {
    const result = await sendTelegramIzinKembali(
      karyawan.name,
      karyawan.division,
      karyawan.position,
      existingIzin.jamIzin,
      time,
      durasiFormat
    );
    if (result) {
      console.log('✅ Notifikasi Telegram terkirim untuk', karyawan.name);
    }
  } catch(e) {
    console.error('Error sending Telegram notification:', e);
  }
  
  renderIzinStaff();
  renderHistoryIzinHariIni();
  updateDashboardStats();
  updateTotalIzinAktif();
  
  const tglMulai = document.getElementById('filterTglMulai')?.value;
  const tglAkhir = document.getElementById('filterTglAkhir')?.value;
  const namaStaff = document.getElementById('filterNamaStaff')?.value?.trim();
  if (tglMulai && tglAkhir) {
    renderLaporan(tglMulai, tglAkhir, namaStaff);
  }
  document.getElementById('modalPilihKaryawanIzin').classList.remove('active');
}

function setupIzinEvents() {
  const btnIzinKeluar = document.getElementById('btnIzinKeluar');
  if (btnIzinKeluar) {
    const newBtn = btnIzinKeluar.cloneNode(true);
    btnIzinKeluar.parentNode.replaceChild(newBtn, btnIzinKeluar);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!hasPermission('create')) {
        showToast('⚠️ Anda tidak memiliki izin untuk membuat izin!', 'error');
        return;
      }
      openPilihKaryawanIzin('keluar');
    });
  }

  const btnSudahKembali = document.getElementById('btnSudahKembali');
  if (btnSudahKembali) {
    const newBtn = btnSudahKembali.cloneNode(true);
    btnSudahKembali.parentNode.replaceChild(newBtn, btnSudahKembali);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!hasPermission('edit')) {
        showToast('⚠️ Anda tidak memiliki izin untuk mengupdate izin!', 'error');
        return;
      }
      openPilihKaryawanIzin('kembali');
    });
  }

  const form = document.getElementById('formSubmitIzin');
  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const keterangan = document.getElementById('inputKeteranganIzin').value;
      if (!keterangan) {
        showToast('⚠️ Harap pilih keterangan izin!', 'error');
        return;
      }
      
      const today = getTodayDate();
      const time = getCurrentTime();
      const karyawan = selectedKaryawanForIzin;
      
      if (!karyawan) {
        showToast('⚠️ Data karyawan tidak ditemukan!', 'error');
        return;
      }
      
      const sisa = getSisaWaktuIzin(karyawan.name, today);
      if (sisa <= 0) {
        showToast('⚠️ Kuota izin ' + karyawan.name + ' sudah habis hari ini!', 'warning');
        return;
      }
      
      const newIzin = {
        date: today,
        name: karyawan.name,
        initial: karyawan.initial,
        division: karyawan.division,
        position: karyawan.position,
        status: 'Izin Keluar',
        jamIzin: time,
        keterangan: keterangan,
        jamKembali: '-',
        durasiIzin: '-'
      };
      
      izinData.push(newIzin);
      console.log('📝 New izin added:', newIzin);
      
      // SIMPAN KE DATABASE
      if (USE_DATABASE && window.db && typeof window.db.saveIzin === 'function') {
        try {
          await window.db.saveIzin(newIzin);
          console.log('✅ Izin saved to database');
        } catch(e) {
          console.error('Error saving izin to database:', e);
        }
      }
      
      // Simpan ke localStorage
      try {
        localStorage.setItem('hrpro_izin_data', JSON.stringify(izinData));
        console.log('✅ Izin saved to localStorage');
      } catch(e) {
        console.error('Error saving izin to localStorage:', e);
      }
      
      // Kirim notifikasi Telegram
      try {
        const result = await sendTelegramIzinKeluar(
          karyawan.name,
          karyawan.division,
          karyawan.position,
          time,
          keterangan,
          sisa
        );
        if (result) {
          console.log('✅ Notifikasi Telegram terkirim untuk', karyawan.name);
        }
      } catch(e) {
        console.error('Error sending Telegram notification:', e);
      }
      
      document.getElementById('modalSubmitIzin').classList.remove('active');
      renderIzinStaff();
      renderHistoryIzinHariIni();
      updateDashboardStats();
      updateTotalIzinAktif();
      selectedKaryawanForIzin = null;
      showToast('✅ Izin berhasil diajukan!', 'success');
    });
  }

  const closePilihIzin = document.getElementById('closePilihIzinModal');
  if (closePilihIzin) {
    closePilihIzin.addEventListener('click', function() {
      document.getElementById('modalPilihKaryawanIzin').classList.remove('active');
    });
  }

  const closePilihIzinBtn = document.getElementById('closePilihIzinBtn');
  if (closePilihIzinBtn) {
    closePilihIzinBtn.addEventListener('click', function() {
      document.getElementById('modalPilihKaryawanIzin').classList.remove('active');
    });
  }

  const modalIzin = document.getElementById('modalPilihKaryawanIzin');
  if (modalIzin) {
    modalIzin.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  }

  const searchIzin = document.getElementById('searchKaryawanIzin');
  if (searchIzin) {
    searchIzin.addEventListener('keyup', function() {
      renderDaftarKaryawanIzin(this.value);
    });
  }

  const closeSubmitIzin = document.getElementById('closeSubmitIzinModal');
  if (closeSubmitIzin) {
    closeSubmitIzin.addEventListener('click', function() {
      document.getElementById('modalSubmitIzin').classList.remove('active');
      selectedKaryawanForIzin = null;
    });
  }

  const cancelSubmitIzin = document.getElementById('cancelSubmitIzin');
  if (cancelSubmitIzin) {
    cancelSubmitIzin.addEventListener('click', function() {
      document.getElementById('modalSubmitIzin').classList.remove('active');
      selectedKaryawanForIzin = null;
    });
  }

  const modalSubmit = document.getElementById('modalSubmitIzin');
  if (modalSubmit) {
    modalSubmit.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
        selectedKaryawanForIzin = null;
      }
    });
  }
}

// ========== LAPORAN FUNCTIONS ==========
function getLaporanData(tglMulai, tglAkhir, namaStaff = '') {
  const MAX_IZIN_PER_HARI = getKuotaIzinPerHari();
  
  // PASTIKAN DATA IZIN TERBARU
  try {
    const savedIzin = localStorage.getItem('hrpro_izin_data');
    if (savedIzin) {
      const parsed = JSON.parse(savedIzin);
      if (Array.isArray(parsed) && parsed.length > 0) {
        izinData = parsed;
      }
    }
  } catch(e) {
    console.error('Error loading izin data:', e);
  }
  
  console.log('📊 Data izin untuk laporan:', izinData.length, 'items');
  console.log('📅 Periode:', tglMulai, '-', tglAkhir);
  
  // Filter data izin yang sudah kembali
  let filteredIzin = izinData.filter(item => 
    item.status === 'Kembali' && 
    item.durasiIzin !== '-' &&
    item.date >= tglMulai &&
    item.date <= tglAkhir
  );
  
  console.log('📊 Filtered izin (Kembali):', filteredIzin.length, 'items');
  
  // Filter berdasarkan nama staff jika ada
  if (namaStaff && namaStaff.trim() !== '') {
    filteredIzin = filteredIzin.filter(item => 
      item.name.toLowerCase().includes(namaStaff.toLowerCase())
    );
  }
  
  // Kelompokkan data per staff per tanggal
  const laporan = {};
  
  filteredIzin.forEach(item => {
    const key = `${item.name}|${item.date}`;
    if (!laporan[key]) {
      laporan[key] = {
        name: item.name,
        date: item.date,
        division: item.division,
        position: item.position,
        totalDurasi: 0,
        detailIzin: []
      };
    }
    
    // Hitung durasi dalam menit
    const durasi = item.durasiIzin;
    if (durasi && durasi !== '-') {
      let menit = 0;
      const jamMatch = durasi.match(/(\d+)\s*jam/);
      const menitMatch = durasi.match(/(\d+)\s*menit/);
      
      if (jamMatch) menit += parseInt(jamMatch[1]) * 60;
      if (menitMatch) menit += parseInt(menitMatch[1]);
      
      if (!jamMatch && !menitMatch) {
        const angka = parseInt(durasi);
        if (!isNaN(angka)) menit = angka;
      }
      laporan[key].totalDurasi += menit;
      laporan[key].detailIzin.push({
        jamIzin: item.jamIzin,
        jamKembali: item.jamKembali,
        durasi: durasi,
        keterangan: item.keterangan
      });
    }
  });
  
  console.log('📊 Laporan grouped:', Object.keys(laporan).length, 'entries');
  
  // Konversi ke array dan sort
  const result = Object.values(laporan)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return a.name.localeCompare(b.name);
    });
  
  console.log('📊 Hasil laporan akhir:', result.length, 'items');
  
  // Log detail untuk debugging
  result.forEach(item => {
    console.log(`📊 ${item.name} - ${item.date}: ${item.totalDurasi} menit (Kuota: ${MAX_IZIN_PER_HARI})`);
  });
  
  return result;
}

function renderLaporan(tglMulai, tglAkhir, namaStaff = '') {
  const tbody = document.getElementById('laporanTableBody');
  if (!tbody) {
    console.warn('❌ Element #laporanTableBody tidak ditemukan!');
    return;
  }
  tbody.innerHTML = '';
  
  const tanggalInfo = document.getElementById('tanggalInfo');
  const tanggalInfoText = document.getElementById('tanggalInfoText');
  
  if (tglMulai && tglAkhir) {
    if (tanggalInfo) {
      tanggalInfo.style.display = 'block';
    }
    if (tanggalInfoText) {
      const mulaiFormatted = formatDate(tglMulai);
      const akhirFormatted = formatDate(tglAkhir);
      tanggalInfoText.textContent = `Menampilkan data dari ${mulaiFormatted} sampai ${akhirFormatted}`;
    }
  } else {
    if (tanggalInfo) {
      tanggalInfo.style.display = 'none';
    }
  }
  
  if (!tglMulai || !tglAkhir) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-calendar" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
      Silakan pilih rentang tanggal dan klik "Tampilkan"
    </td></tr>`;
    return;
  }
  
  const data = getLaporanData(tglMulai, tglAkhir, namaStaff);
  const MAX_IZIN_PER_HARI = getKuotaIzinPerHari();
  
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-check-circle" style="font-size: 24px; display: block; margin-bottom: 8px; color: #4ade80;"></i>
      Tidak ada data izin pada periode ini
    </td></tr>`;
    return;
  }
  
  // TAMPILKAN SEMUA DATA DENGAN INDIKATOR BONUS
  data.forEach(item => {
    const tr = document.createElement('tr');
    const durasiFormat = formatDurasi(item.totalDurasi);
    
    // Cek apakah melebihi kuota
    const isOverKuota = item.totalDurasi > MAX_IZIN_PER_HARI;
    const hasil = getPemotonganBonus(item.totalDurasi);
    
    let statusClass = 'hadir';
    let bonusText = '0%';
    let bonusColor = '#4ade80';
    let statusText = 'Normal ✅';
    
    if (isOverKuota) {
      if (hasil.status === 'Peringatan 10%') {
        statusClass = 'terlambat';
        bonusText = '10%';
        bonusColor = '#fb923c';
        statusText = '⚠️ Peringatan 10%';
      } else if (hasil.status === 'Peringatan 20%') {
        statusClass = 'terlambat';
        bonusText = '20%';
        bonusColor = '#f97316';
        statusText = '⚠️ Peringatan 20%';
      } else if (hasil.status === 'Peringatan 30%') {
        statusClass = 'izin-keluar';
        bonusText = '30%';
        bonusColor = '#ef4444';
        statusText = '⚠️ Peringatan 30%';
      } else if (hasil.status === 'PEMECATAN') {
        statusClass = 'alpha';
        bonusText = '⚠️ PEMECATAN!';
        bonusColor = '#dc2626';
        statusText = '🚫 PEMECATAN!';
      } else {
        // Jika melebihi kuota tapi tidak ada aturan bonus spesifik
        statusClass = 'izin-keluar';
        bonusText = '⚠️ Over Kuota';
        bonusColor = '#facc15';
        statusText = '⚠️ Melebihi Kuota';
      }
    }
    
    const dateObj = new Date(item.date);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('id-ID', { month: 'short' });
    const year = dateObj.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;
    
    // Tambahkan detail durasi per izin
    let detailDurasi = '';
    if (item.detailIzin && item.detailIzin.length > 0) {
      detailDurasi = item.detailIzin.map(d => d.durasi).join(' + ');
    }
    
    tr.innerHTML = `
      <td><strong>${formattedDate}</strong></td>
      <td><strong>${item.name}</strong></td>
      <td>${item.division}</td>
      <td>${item.position}</td>
      <td>
        <span class="status-badge izin">${durasiFormat}</span>
        ${detailDurasi ? `<br><small style="color: rgba(255,255,255,0.3); font-size: 10px;">${detailDurasi}</small>` : ''}
        <br><small style="color: rgba(255,255,255,0.3); font-size: 10px;">Kuota: ${MAX_IZIN_PER_HARI} menit</small>
      </td>
      <td>
        <span class="status-badge ${statusClass}" style="color: ${bonusColor}; font-weight: 600;">
          ${bonusText}
        </span>
        <br><small style="color: rgba(255,255,255,0.3); font-size: 10px;">${statusText}</small>
      </td>
      <td>
        <button class="btn-action edit" onclick="openRiwayatIzin('${item.name}')" title="Lihat Riwayat">
          <i class="fas fa-history"></i> Riwayat
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  console.log('✅ Laporan rendered:', data.length, 'rows');
}

let riwayatNamaStaff = '';

window.openRiwayatIzin = function(nama) {
  riwayatNamaStaff = nama;
  document.getElementById('riwayatNamaStaff').textContent = nama;
  
  const today = getTodayDate();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const tglMulai = lastWeek.toISOString().split('T')[0];
  
  document.getElementById('riwayatTglMulai').value = tglMulai;
  document.getElementById('riwayatTglAkhir').value = today;
  
  document.getElementById('modalRiwayatIzin').classList.add('active');
  renderRiwayatIzin(tglMulai, today);
};

function renderRiwayatIzin(tglMulai, tglAkhir) {
  const tbody = document.getElementById('riwayatTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const filtered = izinData.filter(item => 
    item.name === riwayatNamaStaff &&
    item.date >= tglMulai &&
    item.date <= tglAkhir &&
    item.status === 'Kembali' &&
    item.durasiIzin !== '-'
  ).sort((a, b) => b.date.localeCompare(a.date) || a.jamIzin.localeCompare(b.jamIzin));
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.4);">
      Tidak ada data izin untuk periode ini
    </td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    const tr = document.createElement('tr');
    const statusClass = item.status === 'Kembali' ? 'kembali' : 'izin-keluar';
    
    tr.innerHTML = `
      <td>${formatDate(item.date)}</td>
      <td>${item.jamIzin}</td>
      <td>${item.jamKembali}</td>
      <td><span class="status-badge izin">${item.durasiIzin}</span></td>
      <td>${item.keterangan}</td>
      <td><span class="status-badge ${statusClass}">${item.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupLaporanEvents() {
    const btnFilter = document.getElementById('btnFilterLaporan');
    if (btnFilter) {
        const newBtn = btnFilter.cloneNode(true);
        btnFilter.parentNode.replaceChild(newBtn, btnFilter);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let tglMulai = document.getElementById('filterTglMulai')?.value;
            let tglAkhir = document.getElementById('filterTglAkhir')?.value;
            
            if (!tglMulai || !tglAkhir) {
                const periodText = document.getElementById('selectedPeriodText')?.textContent || '';
                if (periodText && periodText.includes(' - ')) {
                    const parts = periodText.split(' - ');
                    if (parts.length === 2) {
                        try {
                            const startDate = new Date(parts[0]);
                            const endDate = new Date(parts[1]);
                            if (!isNaN(startDate) && !isNaN(endDate)) {
                                tglMulai = startDate.toISOString().split('T')[0];
                                tglAkhir = endDate.toISOString().split('T')[0];
                            }
                        } catch(e) {}
                    }
                }
            }
            
            const namaStaff = document.getElementById('filterNamaStaff')?.value?.trim() || '';
            
            if (!tglMulai || !tglAkhir) {
                showToast('⚠️ Silakan pilih periode terlebih dahulu!', 'error');
                return;
            }
            
            if (tglMulai > tglAkhir) {
                showToast('⚠️ Tanggal mulai harus lebih kecil dari tanggal akhir!', 'error');
                return;
            }
            
            document.getElementById('filterTglMulai').value = tglMulai;
            document.getElementById('filterTglAkhir').value = tglAkhir;
            
            renderLaporan(tglMulai, tglAkhir, namaStaff);
        });
    }

    const btnReset = document.getElementById('btnResetFilter');
    if (btnReset) {
        const newBtn = btnReset.cloneNode(true);
        btnReset.parentNode.replaceChild(newBtn, btnReset);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const today = getTodayDate();
            const lastMonth = new Date();
            lastMonth.setDate(lastMonth.getDate() - 30);
            const tglMulai = lastMonth.toISOString().split('T')[0];
            
            document.getElementById('filterTglMulai').value = tglMulai;
            document.getElementById('filterTglAkhir').value = today;
            document.getElementById('selectedPeriodText').textContent = `${formatDate(tglMulai)} - ${formatDate(today)}`;
            document.getElementById('filterNamaStaff').value = '';
            document.getElementById('tanggalInfo').style.display = 'none';
            
            renderLaporan(tglMulai, today, '');
        });
    }

  const btnDatePicker = document.getElementById('btnDatePicker');
  if (btnDatePicker) {
    const newBtn = btnDatePicker.cloneNode(true);
    btnDatePicker.parentNode.replaceChild(newBtn, btnDatePicker);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      openDatePicker();
    });
  }

  const applyPicker = document.getElementById('applyDatePicker');
  if (applyPicker) {
    const newBtn = applyPicker.cloneNode(true);
    applyPicker.parentNode.replaceChild(newBtn, applyPicker);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      applyDatePicker();
    });
  }

  const btnRiwayatFilter = document.getElementById('btnRiwayatFilter');
  if (btnRiwayatFilter) {
    btnRiwayatFilter.addEventListener('click', function() {
      const tglMulai = document.getElementById('riwayatTglMulai').value;
      const tglAkhir = document.getElementById('riwayatTglAkhir').value;
      
      if (!tglMulai || !tglAkhir) {
        showToast('⚠️ Silakan pilih tanggal mulai dan akhir!', 'error');
        return;
      }
      
      if (tglMulai > tglAkhir) {
        showToast('⚠️ Tanggal mulai harus lebih kecil dari tanggal akhir!', 'error');
        return;
      }
      
      renderRiwayatIzin(tglMulai, tglAkhir);
    });
  }

  const closeRiwayat = document.getElementById('closeRiwayatModal');
  if (closeRiwayat) {
    closeRiwayat.addEventListener('click', function() {
      document.getElementById('modalRiwayatIzin').classList.remove('active');
    });
  }

  const closeRiwayatBtn = document.getElementById('closeRiwayatBtn');
  if (closeRiwayatBtn) {
    closeRiwayatBtn.addEventListener('click', function() {
      document.getElementById('modalRiwayatIzin').classList.remove('active');
    });
  }

  const modalRiwayat = document.getElementById('modalRiwayatIzin');
  if (modalRiwayat) {
    modalRiwayat.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('.btn-quick').forEach(btn => {
    btn.addEventListener('click', function() {
      setQuickPeriod(this.dataset.period);
    });
  });

  const prevMonth = document.getElementById('prevMonth');
  if (prevMonth) {
    prevMonth.addEventListener('click', function() {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
    });
  }

  const nextMonth = document.getElementById('nextMonth');
  if (nextMonth) {
    nextMonth.addEventListener('click', function() {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
    });
  }

  const pickerStart = document.getElementById('pickerStartDate');
  if (pickerStart) {
    pickerStart.addEventListener('change', function() {
      if (this.value) {
        selectedStartDate = this.value;
        if (selectedEndDate && selectedStartDate > selectedEndDate) {
          selectedEndDate = null;
          document.getElementById('pickerEndDate').value = '';
        }
        updateRangeDisplay();
        renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
      }
    });
  }

  const pickerEnd = document.getElementById('pickerEndDate');
  if (pickerEnd) {
    pickerEnd.addEventListener('change', function() {
      if (this.value) {
        selectedEndDate = this.value;
        if (selectedStartDate && selectedEndDate < selectedStartDate) {
          this.value = '';
          selectedEndDate = null;
          return;
        }
        updateRangeDisplay();
        renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
      }
    });
  }

  const closePicker = document.getElementById('closeDatePicker');
  if (closePicker) {
    closePicker.addEventListener('click', closeDatePicker);
  }

  const cancelPicker = document.getElementById('cancelDatePicker');
  if (cancelPicker) {
    cancelPicker.addEventListener('click', closeDatePicker);
  }

  const modalPicker = document.getElementById('modalDatePicker');
  if (modalPicker) {
    modalPicker.addEventListener('click', function(e) {
      if (e.target === this) closeDatePicker();
    });
  }
}

function setDefaultFilterDate() {
  const today = getTodayDate();
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);
  const tglMulai = lastMonth.toISOString().split('T')[0];
  
  const filterMulai = document.getElementById('filterTglMulai');
  const filterAkhir = document.getElementById('filterTglAkhir');
  const periodText = document.getElementById('selectedPeriodText');
  
  if (filterMulai) filterMulai.value = tglMulai;
  if (filterAkhir) filterAkhir.value = today;
  if (periodText) periodText.textContent = `${formatDate(tglMulai)} - ${formatDate(today)}`;
  
  renderLaporan(tglMulai, today, '');
}

// ========== DATE PICKER ==========
let pickerStartDate = null;
let pickerEndDate = null;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let selectedStartDate = null;
let selectedEndDate = null;
let isSelectingStart = true;

function openDatePicker() {
  const modal = document.getElementById('modalDatePicker');
  modal.classList.add('active');
  
  selectedStartDate = null;
  selectedEndDate = null;
  isSelectingStart = true;
  
  document.getElementById('pickerStartDate').value = '';
  document.getElementById('pickerEndDate').value = '';
  document.getElementById('selectedRangeDisplay').textContent = '-';
  
  const now = new Date();
  currentCalendarMonth = now.getMonth();
  currentCalendarYear = now.getFullYear();
  renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
  
  document.querySelectorAll('.btn-quick').forEach(btn => btn.classList.remove('active'));
}

function closeDatePicker() {
  document.getElementById('modalDatePicker').classList.remove('active');
}

function renderTwoCalendars(month, year) {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = year - 1;
  }
  
  document.getElementById('calendarRangeLabel').textContent = `${monthNames[prevMonth]} ${prevYear} - ${monthNames[month]} ${year}`;
  document.getElementById('calendarMonthPrev').textContent = `${monthNames[prevMonth]} ${prevYear}`;
  document.getElementById('calendarMonthCurrent').textContent = `${monthNames[month]} ${year}`;
  
  renderCalendarSingle('calendarBodyPrev', prevMonth, prevYear);
  renderCalendarSingle('calendarBodyCurrent', month, year);
}

function renderCalendarSingle(containerId, month, year) {
  const tbody = document.getElementById(containerId);
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let date = 1;
  let row = document.createElement('tr');
  let dayCounter = 0;
  
  for (let i = 0; i < firstDay; i++) {
    const td = document.createElement('td');
    const prevMonthDays = new Date(year, month, 0).getDate();
    td.textContent = prevMonthDays - firstDay + i + 1;
    td.className = 'other-month';
    td.style.color = 'rgba(255,255,255,0.2)';
    td.style.cursor = 'default';
    row.appendChild(td);
    dayCounter++;
  }
  
  for (let i = 0; i < daysInMonth; i++) {
    const td = document.createElement('td');
    td.textContent = date;
    td.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    td.dataset.day = date;
    td.dataset.month = month;
    td.dataset.year = year;
    td.style.cursor = 'pointer';
    
    const today = new Date();
    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      td.classList.add('today');
      td.style.border = '1px solid rgba(59, 130, 246, 0.4)';
      td.style.fontWeight = '600';
    }
    
    if (selectedStartDate && selectedEndDate) {
      const cellDate = new Date(year, month, date);
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      if (cellDate >= start && cellDate <= end) {
        if (cellDate.getTime() === start.getTime()) {
          td.classList.add('selected-start');
          td.style.background = 'rgba(59, 130, 246, 0.4)';
          td.style.color = '#ffffff';
          td.style.borderRadius = '4px 0 0 4px';
        } else if (cellDate.getTime() === end.getTime()) {
          td.classList.add('selected-end');
          td.style.background = 'rgba(59, 130, 246, 0.4)';
          td.style.color = '#ffffff';
          td.style.borderRadius = '0 4px 4px 0';
        } else {
          td.classList.add('selected-range');
          td.style.background = 'rgba(59, 130, 246, 0.15)';
          td.style.color = '#93c5fd';
        }
      }
    } else if (selectedStartDate) {
      const cellDate = new Date(year, month, date);
      const start = new Date(selectedStartDate);
      if (cellDate.getTime() === start.getTime()) {
        td.classList.add('selected-start');
        td.style.background = 'rgba(59, 130, 246, 0.4)';
        td.style.color = '#ffffff';
        td.style.borderRadius = '4px';
      }
    }
    
    td.addEventListener('click', function() {
      const dateStr = this.dataset.date;
      if (!dateStr || this.classList.contains('other-month')) return;
      
      if (isSelectingStart || !selectedStartDate) {
        selectedStartDate = dateStr;
        selectedEndDate = null;
        isSelectingStart = false;
        document.getElementById('pickerStartDate').value = dateStr;
        document.getElementById('pickerEndDate').value = '';
      } else {
        const start = new Date(selectedStartDate);
        const end = new Date(dateStr);
        if (end >= start) {
          selectedEndDate = dateStr;
          document.getElementById('pickerEndDate').value = dateStr;
          isSelectingStart = true;
        } else {
          selectedStartDate = dateStr;
          selectedEndDate = null;
          document.getElementById('pickerStartDate').value = dateStr;
          document.getElementById('pickerEndDate').value = '';
          isSelectingStart = false;
        }
      }
      
      updateRangeDisplay();
      renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
    });
    
    td.addEventListener('mouseenter', function() {
      if (!this.classList.contains('other-month')) {
        this.style.background = 'rgba(59, 130, 246, 0.2)';
        this.style.color = '#ffffff';
        this.style.borderRadius = '4px';
      }
    });
    
    td.addEventListener('mouseleave', function() {
      if (!this.classList.contains('other-month') && !this.classList.contains('selected-start') && !this.classList.contains('selected-end') && !this.classList.contains('selected-range')) {
        this.style.background = 'transparent';
        this.style.color = 'rgba(255,255,255,0.7)';
        this.style.borderRadius = '0';
      }
      if (this.classList.contains('today') && !this.classList.contains('selected-start') && !this.classList.contains('selected-end') && !this.classList.contains('selected-range')) {
        this.style.border = '1px solid rgba(59, 130, 246, 0.4)';
      }
    });
    
    row.appendChild(td);
    date++;
    dayCounter++;
    
    if (dayCounter % 7 === 0 && i < daysInMonth - 1) {
      tbody.appendChild(row);
      row = document.createElement('tr');
    }
  }
  
  const totalCells = firstDay + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const td = document.createElement('td');
    td.textContent = i;
    td.className = 'other-month';
    td.style.color = 'rgba(255,255,255,0.2)';
    td.style.cursor = 'default';
    row.appendChild(td);
  }
  
  tbody.appendChild(row);
}

function updateRangeDisplay() {
  if (selectedStartDate && selectedEndDate) {
    const start = formatDate(selectedStartDate);
    const end = formatDate(selectedEndDate);
    document.getElementById('selectedRangeDisplay').textContent = `${start} - ${end}`;
  } else if (selectedStartDate) {
    const start = formatDate(selectedStartDate);
    document.getElementById('selectedRangeDisplay').textContent = `${start} - ...`;
  } else {
    document.getElementById('selectedRangeDisplay').textContent = '-';
  }
}

function setQuickPeriod(period) {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);
  
  switch(period) {
    case 'thisWeek':
      const day = today.getDay();
      start.setDate(today.getDate() - day);
      end.setDate(today.getDate() + (6 - day));
      break;
    case 'thisMonth':
      start.setDate(1);
      end.setMonth(today.getMonth() + 1, 0);
      break;
    case 'lastWeek':
      start.setDate(today.getDate() - today.getDay() - 7);
      end.setDate(today.getDate() - today.getDay() - 1);
      break;
    case 'lastMonth':
      start.setMonth(today.getMonth() - 1, 1);
      end.setMonth(today.getMonth(), 0);
      break;
  }
  
  selectedStartDate = start.toISOString().split('T')[0];
  selectedEndDate = end.toISOString().split('T')[0];
  
  document.getElementById('pickerStartDate').value = selectedStartDate;
  document.getElementById('pickerEndDate').value = selectedEndDate;
  
  updateRangeDisplay();
  renderTwoCalendars(currentCalendarMonth, currentCalendarYear);
  
  document.querySelectorAll('.btn-quick').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
}

function applyDatePicker() {
  const start = document.getElementById('pickerStartDate').value;
  const end = document.getElementById('pickerEndDate').value;
  
  if (!start || !end) {
    showToast('⚠️ Silakan pilih tanggal mulai dan akhir!', 'error');
    return;
  }
  
  if (start > end) {
    showToast('⚠️ Tanggal mulai harus lebih kecil dari tanggal akhir!', 'error');
    return;
  }
  
  const filterMulai = document.getElementById('filterTglMulai');
  const filterAkhir = document.getElementById('filterTglAkhir');
  const periodText = document.getElementById('selectedPeriodText');
  
  if (filterMulai) filterMulai.value = start;
  if (filterAkhir) filterAkhir.value = end;
  
  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);
  if (periodText) periodText.textContent = `${startFormatted} - ${endFormatted}`;
  
  closeDatePicker();
  
  const namaStaff = document.getElementById('filterNamaStaff')?.value?.trim() || '';
  renderLaporan(start, end, namaStaff);
}

// ========== USERS FUNCTIONS ==========
let usersData = [
  {
    id: 1,
    email: 'superadmin@hrpro.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'Superadmin',
    situs: 'HR Pro Indonesia',
    status: 'Active',
    createdDate: '2026-07-01'
  },
  {
    id: 2,
    email: 'admin@hrpro.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'Admin',
    situs: 'HR Pro Indonesia',
    status: 'Active',
    createdDate: '2026-07-05'
  },
  {
    id: 3,
    email: 'user@hrpro.com',
    password: 'user123',
    name: 'Regular User',
    role: 'User',
    situs: 'WDBOS',
    status: 'Inactive',
    createdDate: '2026-07-10'
  },
  {
    id: 4,
    email: 'test1@gmail.com',
    password: 'test123',
    name: 'Test User 1',
    role: 'User',
    situs: 'Negri Slot',
    status: 'Inactive',
    createdDate: '2026-07-10'
  },
  {
    id: 5,
    email: 'test2@gmail.com',
    password: 'test123',
    name: 'Test User 2',
    role: 'User',
    situs: 'WDBOS',
    status: 'Active',
    createdDate: '2026-07-09'
  },
  {
    id: 6,
    email: 'test3@gmail.com',
    password: 'test123',
    name: 'Test User 3',
    role: 'Admin',
    situs: 'HR Pro Indonesia',
    status: 'Inactive',
    createdDate: '2026-07-08'
  },
  {
    id: 7,
    email: 'test4@gmail.com',
    password: 'test123',
    name: 'Test User 4',
    role: 'User',
    situs: 'Negri Slot',
    status: 'Active',
    createdDate: '2026-07-07'
  },
  {
    id: 8,
    email: 'test5@gmail.com',
    password: 'test123',
    name: 'Test User 5',
    role: 'User',
    situs: 'WDBOS',
    status: 'Inactive',
    createdDate: '2026-07-06'
  },
  {
    id: 9,
    email: 'test6@gmail.com',
    password: 'test123',
    name: 'Test User 6',
    role: 'Admin',
    situs: 'HR Pro Indonesia',
    status: 'Active',
    createdDate: '2026-07-05'
  },
  {
    id: 10,
    email: 'test7@gmail.com',
    password: 'test123',
    name: 'Test User 7',
    role: 'User',
    situs: 'Negri Slot',
    status: 'Inactive',
    createdDate: '2026-07-04'
  },
];
let nextUserId = 11;
let currentPage = 1;
let entriesPerPage = 10;

function renderUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (usersData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
      <i class="fas fa-users" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
      Belum ada user. Silakan lakukan pendaftaran.
    </td></tr>`;
    document.getElementById('showingInfo').textContent = 'Showing 0 - 0 of 0';
    return;
  }
  
  const totalData = usersData.length;
  const totalPages = Math.ceil(totalData / entriesPerPage);
  
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalData);
  const pageData = usersData.slice(startIndex, endIndex);
  
  const startDisplay = totalData > 0 ? startIndex + 1 : 0;
  const endDisplay = endIndex;
  document.getElementById('showingInfo').textContent = `Showing ${startDisplay} - ${endDisplay} of ${totalData}`;
  
  pageData.forEach((item, index) => {
    const tr = document.createElement('tr');
    const statusClass = item.status === 'Active' ? 'hadir' : 'izin';
    const statusColor = item.status === 'Active' ? '#4ade80' : '#facc15';
    
    tr.innerHTML = `
      <td>${startIndex + index + 1}</td>
      <td><strong>${item.email}</strong></td>
      <td><span class="status-badge" style="background: rgba(59,130,246,0.2); color: #93c5fd;">${item.role}</span></td>
      <td>${item.situs}</td>
      <td><span class="status-badge ${statusClass}" style="color: ${statusColor};">${item.status}</span></td>
      <td>
        <button class="btn-action edit" onclick="editUser(${item.id})" title="Edit User">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-action delete" onclick="deleteUser(${item.id})" title="Hapus User">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupUsersEvents() {
  const showEntries = document.getElementById('showEntries');
  if (showEntries) {
    showEntries.addEventListener('change', function() {
      entriesPerPage = parseInt(this.value);
      currentPage = 1;
      renderUsers();
    });
  }
}

// ========== DELETE USER - PERBAIKAN ==========
window.deleteUser = async function(id) {
    const user = usersData.find(item => item.id === id);
    if (!user) {
        showToast('⚠️ User tidak ditemukan!', 'error');
        return;
    }
    
    if (user.role === 'Superadmin') {
        showToast('⚠️ Tidak dapat menghapus Superadmin!', 'error');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${user.email}"?`)) {
        return;
    }
    
    try {
        // Hapus dari database
        if (USE_DATABASE && window.db && typeof window.db.deleteUser === 'function') {
            await window.db.deleteUser(id);
        }
        
        // Hapus dari array lokal
        usersData = usersData.filter(item => item.id !== id);
        
        // Simpan ke localStorage sebagai fallback
        localStorage.setItem('hrpro_users', JSON.stringify(usersData));
        
        // Refresh UI
        renderUsers();
        showToast('✅ User berhasil dihapus!', 'success');
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('❌ Gagal menghapus user!', 'error');
    }
};

// ========== ROLES FUNCTIONS ==========
let rolesData = [
  {
    id: 1,
    roleName: 'Superadmin',
    menus: ['dashboard', 'karyawan', 'izin', 'laporan', 'users', 'pengaturan', 'roles', 'api-telegram'],
    permissions: ['create', 'edit', 'delete'],
    status: 'Active'
  },
  {
    id: 2,
    roleName: 'Admin',
    menus: ['dashboard', 'karyawan', 'izin', 'laporan', 'users', 'api-telegram'],
    permissions: ['create', 'edit', 'delete'],
    status: 'Active'
  },
  {
    id: 3,
    roleName: 'User',
    menus: ['dashboard', 'karyawan', 'izin'],
    permissions: ['create'],
    status: 'Inactive'
  },
  {
    id: 4,
    roleName: 'Manager',
    menus: ['dashboard', 'karyawan', 'izin', 'laporan'],
    permissions: ['create', 'edit'],
    status: 'Active'
  },
];
let nextRoleId = 5;

function renderRoles() {
    const tbody = document.getElementById('rolesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Pastikan role Admin tidak memiliki menu yang salah
    const adminIndex = rolesData.findIndex(r => r.roleName === 'Admin');
    if (adminIndex !== -1) {
        const adminRole = rolesData[adminIndex];
        if (adminRole.menus.includes('roles') || adminRole.menus.includes('pengaturan')) {
            adminRole.menus = adminRole.menus.filter(m => m !== 'roles' && m !== 'pengaturan');
            console.log('🛠️ Fixed Admin role menus in renderRoles:', adminRole.menus);
            localStorage.setItem('hrpro_roles_data', JSON.stringify(rolesData));
        }
    }
    
    // Pastikan Superadmin selalu ada
    const superadminExists = rolesData.some(r => r.roleName === 'Superadmin');
    if (!superadminExists) {
        rolesData.push({
            id: nextRoleId++,
            roleName: 'Superadmin',
            menus: ['dashboard', 'karyawan', 'izin', 'laporan', 'users', 'pengaturan', 'roles', 'api-telegram'],
            permissions: ['create', 'edit', 'delete'],
            status: 'Active'
        });
        saveRolesData();
    }
    
    if (rolesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
            <i class="fas fa-user-tag" style="font-size: 24px; display: block; margin-bottom: 8px;"></i>
            Belum ada data role. Silakan tambah role baru.
        </td></tr>`;
        return;
    }
    
    const menuNames = {
        dashboard: 'Dashboard',
        karyawan: 'Karyawan',
        izin: 'Izin Staff',
        laporan: 'Laporan Izin',
        users: 'Users',
        pengaturan: 'Pengaturan',
        roles: 'Roles',
        'api-telegram': 'Api Telegram'
    };
    
    rolesData.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusClass = item.status === 'Active' ? 'hadir' : 'izin';
        const statusColor = item.status === 'Active' ? '#4ade80' : '#facc15';
        
        const menuList = item.menus.map(m => menuNames[m] || m).join(', ');
        const permList = item.permissions.join(', ');
        
        const isSuperadmin = item.roleName === 'Superadmin';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${item.roleName}</strong></td>
            <td style="font-size: 12px;">${menuList}</td>
            <td><span class="status-badge" style="background: rgba(59,130,246,0.15); color: #93c5fd;">${permList}</span></td>
            <td><span class="status-badge ${statusClass}" style="color: ${statusColor};">${item.status}</span></td>
            <td>
                <button class="btn-action edit" onclick="editRole(${item.id})" title="Edit Role">
                    <i class="fas fa-edit"></i>
                </button>
                ${!isSuperadmin ? `<button class="btn-action delete" onclick="deleteRole(${item.id})" title="Hapus Role">
                    <i class="fas fa-trash"></i>
                </button>` : '<span style="color: rgba(255,255,255,0.2); font-size: 11px;">Protected</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editRole = function(id) {
    const role = rolesData.find(item => item.id === id);
    if (!role) {
        showToast('⚠️ Role tidak ditemukan!', 'error');
        return;
    }
    
    if (role.roleName === 'Superadmin') {
        showToast('⚠️ Role Superadmin tidak dapat diedit!', 'warning');
        return;
    }
    
    document.getElementById('modalRoleTitle').innerHTML = '<i class="fas fa-user-edit" style="color: #3b82f6;"></i> Edit Role';
    document.getElementById('roleSubmitText').textContent = 'Update Role';
    document.getElementById('editRoleId').value = id;
    document.getElementById('inputRoleName').value = role.roleName;
    document.getElementById('inputRoleStatus').value = role.status;
    
    document.querySelectorAll('.menu-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.permission-checkbox').forEach(cb => cb.checked = false);
    
    document.querySelectorAll('.menu-checkbox').forEach(cb => {
        if (role.menus.includes(cb.value)) {
            cb.checked = true;
        }
    });
    
    document.querySelectorAll('.permission-checkbox').forEach(cb => {
        if (role.permissions.includes(cb.value)) {
            cb.checked = true;
        }
    });
    
    document.getElementById('modalRole').classList.add('active');
};

// ========== DELETE ROLE - PERBAIKAN ==========
window.deleteRole = async function(id) {
    const role = rolesData.find(item => item.id === id);
    if (!role) {
        showToast('⚠️ Role tidak ditemukan!', 'error');
        return;
    }
    
    if (role.roleName === 'Superadmin') {
        showToast('⚠️ Role Superadmin tidak dapat dihapus!', 'warning');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus role "${role.roleName}"?`)) {
        return;
    }
    
    try {
        // Hapus dari database
        if (USE_DATABASE && window.db && typeof window.db.deleteRole === 'function') {
            await window.db.deleteRole(id);
        }
        
        // Hapus dari array lokal
        rolesData = rolesData.filter(item => item.id !== id);
        
        // Simpan ke localStorage
        localStorage.setItem('hrpro_roles_data', JSON.stringify(rolesData));
        
        // Refresh UI
        renderRoles();
        setupNavigation();
        showToast('✅ Role berhasil dihapus!', 'success');
    } catch (error) {
        console.error('Error deleting role:', error);
        showToast('❌ Gagal menghapus role!', 'error');
    }
};

function setupRolesEvents() {
    const btnTambahRole = document.getElementById('btnTambahRole');
    if (btnTambahRole) {
        const newBtn = btnTambahRole.cloneNode(true);
        btnTambahRole.parentNode.replaceChild(newBtn, btnTambahRole);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openAddRoleModal();
        });
    }

    const closeRoleModal = document.getElementById('closeRoleModal');
    if (closeRoleModal) {
        closeRoleModal.addEventListener('click', function() {
            document.getElementById('modalRole').classList.remove('active');
        });
    }

    const cancelRoleBtn = document.getElementById('cancelRoleBtn');
    if (cancelRoleBtn) {
        cancelRoleBtn.addEventListener('click', function() {
            document.getElementById('modalRole').classList.remove('active');
        });
    }

    const modalRole = document.getElementById('modalRole');
    if (modalRole) {
        modalRole.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }

    const formRole = document.getElementById('formRole');
    if (formRole) {
        const newForm = formRole.cloneNode(true);
        formRole.parentNode.replaceChild(newForm, formRole);
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const id = document.getElementById('editRoleId').value;
            const roleName = document.getElementById('inputRoleName').value.trim();
            const status = document.getElementById('inputRoleStatus').value;
            
            const selectedMenus = [];
            document.querySelectorAll('.menu-checkbox:checked').forEach(cb => {
                selectedMenus.push(cb.value);
            });
            
            const selectedPermissions = [];
            document.querySelectorAll('.permission-checkbox:checked').forEach(cb => {
                selectedPermissions.push(cb.value);
            });
            
            if (!roleName) {
                showToast('⚠️ Harap isi nama role!', 'error');
                return;
            }
            
            if (selectedMenus.length === 0) {
                showToast('⚠️ Harap pilih minimal satu menu!', 'error');
                return;
            }
            
            if (selectedPermissions.length === 0) {
                showToast('⚠️ Harap pilih minimal satu permission!', 'error');
                return;
            }
            
            // Cek duplikasi
            if (id) {
                const duplicate = rolesData.find(item => 
                    item.roleName.toLowerCase() === roleName.toLowerCase() && 
                    item.id !== parseInt(id)
                );
                if (duplicate) {
                    showToast('⚠️ Nama role sudah digunakan!', 'error');
                    return;
                }
            } else {
                const existing = rolesData.find(item => 
                    item.roleName.toLowerCase() === roleName.toLowerCase()
                );
                if (existing) {
                    showToast('⚠️ Nama role sudah digunakan!', 'error');
                    return;
                }
            }
            
            let successMessage = '';
            
            try {
                if (id) {
                    const role = rolesData.find(item => item.id === parseInt(id));
                    if (role) {
                        role.roleName = roleName;
                        let menus = selectedMenus;
                        if (roleName === 'Admin') {
                            menus = menus.filter(m => m !== 'roles' && m !== 'pengaturan');
                        }
                        role.menus = menus;
                        role.permissions = selectedPermissions;
                        role.status = status;
                        successMessage = `✅ Role "${roleName}" berhasil diupdate!`;
                        
                        // Simpan ke database
                        if (USE_DATABASE && window.db && typeof window.db.saveRole === 'function') {
                            await window.db.saveRole(role);
                        }
                    }
                } else {
                    let menus = selectedMenus;
                    if (roleName === 'Admin') {
                        menus = menus.filter(m => m !== 'roles' && m !== 'pengaturan');
                    }
                    const newRole = {
                        id: nextRoleId++,
                        roleName: roleName,
                        menus: menus,
                        permissions: selectedPermissions,
                        status: status
                    };
                    rolesData.push(newRole);
                    successMessage = `✅ Role "${roleName}" berhasil ditambahkan!`;
                    
                    // Simpan ke database
                    if (USE_DATABASE && window.db && typeof window.db.saveRole === 'function') {
                        await window.db.saveRole(newRole);
                    }
                }
                
                // Simpan ke localStorage sebagai fallback
                localStorage.setItem('hrpro_roles_data', JSON.stringify(rolesData));
                
                renderRoles();
                document.getElementById('modalRole').classList.remove('active');
                document.getElementById('formRole').reset();
                
                setupNavigation();
                showToast(successMessage, 'success');
            } catch (error) {
                console.error('Error saving role:', error);
                showToast('❌ Gagal menyimpan role!', 'error');
            }
        });
    }
}

function openAddRoleModal() {
  document.getElementById('modalRoleTitle').innerHTML = '<i class="fas fa-user-tag" style="color: #3b82f6;"></i> Tambah Role';
  document.getElementById('roleSubmitText').textContent = 'Simpan Role';
  document.getElementById('editRoleId').value = '';
  document.getElementById('inputRoleName').value = '';
  document.getElementById('inputRoleStatus').value = 'Active';
  
  document.querySelectorAll('.menu-checkbox').forEach(cb => cb.checked = false);
  document.querySelectorAll('.permission-checkbox').forEach(cb => cb.checked = false);
  
  document.getElementById('modalRole').classList.add('active');
}

// ========== SETTINGS / PENGATURAN ==========
const settingsData = {
  karyawan: {
    title: 'Pengaturan Karyawan',
    icon: 'fa-users',
    fields: [
      { id: 'karyawan_columns', label: 'Kolom yang ditampilkan', type: 'checkbox-group', 
        options: ['ID', 'Foto', 'Nama', 'Inisial', 'Situs', 'Posisi', 'Telepon', 'Tanggal Join', 'Masa Kerja', 'Status', 'Aksi'] },
      { id: 'karyawan_status_default', label: 'Status Default Karyawan', type: 'select', options: ['Aktif', 'Cuti', 'Resign'] },
      { id: 'karyawan_max_display', label: 'Maksimal tampil di dashboard', type: 'number', placeholder: '10', value: '10' }
    ]
  },
  izin: {
    title: 'Pengaturan Izin Staff',
    icon: 'fa-file-alt',
    fields: [
      { id: 'izin_kuota_per_hari', label: 'Kuota Izin per Hari (menit)', type: 'number', placeholder: '40', value: '40' },
      { id: 'izin_batas_toleransi', label: 'Batas Toleransi (menit)', type: 'number', placeholder: '60', value: '60' }
    ]
  },
  laporan: {
    title: 'Pengaturan Laporan Izin',
    icon: 'fa-chart-line',
    fields: [
      { id: 'laporan_periode_default', label: 'Periode Default (hari)', type: 'number', placeholder: '30', value: '30' }
    ]
  }
};

function openSettingsModal(menu) {
  const settings = settingsData[menu];
  if (!settings) {
    return;
  }

  const modal = document.getElementById('modalSettings');
  const title = document.getElementById('settingsModalTitle');
  const body = document.getElementById('settingsModalBody');
  const submitBtn = document.getElementById('settingsSubmitBtn');

  title.innerHTML = `<i class="fas ${settings.icon} settings-modal-icon" style="color: #3b82f6;"></i> ${settings.title}`;
  submitBtn.textContent = `💾 Simpan Pengaturan ${menu.charAt(0).toUpperCase() + menu.slice(1)}`;

  let formHtml = `<input type="hidden" id="settingsMenu" value="${menu}">`;
  
  if (menu !== 'karyawan') {
    settings.fields.forEach((field) => {
      formHtml += `<div class="form-group">`;
      formHtml += `<label>${field.label}</label>`;

      if (field.type === 'text' || field.type === 'number' || field.type === 'time') {
        const savedValue = localStorage.getItem(`settings_${field.id}`) || field.value || '';
        formHtml += `<input type="${field.type}" id="${field.id}" placeholder="${field.placeholder || ''}" value="${savedValue}" class="settings-field">`;
      } else if (field.type === 'select') {
        const savedValue = localStorage.getItem(`settings_${field.id}`) || field.value || '';
        formHtml += `<select id="${field.id}" class="settings-field">`;
        field.options.forEach(opt => {
          const selected = opt === savedValue ? 'selected' : '';
          formHtml += `<option value="${opt}" ${selected}>${opt}</option>`;
        });
        formHtml += `</select>`;
      } else if (field.type === 'checkbox-group') {
        formHtml += `<div class="form-group">`;
        formHtml += `<label>${field.label}</label>`;
        formHtml += `<div class="checkbox-group">`;
        
        let savedValues = localStorage.getItem(`settings_${field.id}`);
        let valuesToUse = field.options;
        
        if (savedValues) {
          try {
            const parsed = JSON.parse(savedValues);
            if (Array.isArray(parsed) && parsed.length > 0) {
              valuesToUse = parsed;
            }
          } catch(e) {}
        }
        
        field.options.forEach(opt => {
          const checked = valuesToUse.includes(opt) ? 'checked' : '';
          formHtml += `<label><input type="checkbox" class="settings-checkbox" data-group="${field.id}" value="${opt}" ${checked}> ${opt}</label>`;
        });
        
        formHtml += `</div>`;
        formHtml += `<input type="hidden" id="${field.id}" value='${JSON.stringify(valuesToUse)}'>`;
        formHtml += `</div>`;
      }

      formHtml += `</div>`;
    });
  }

  if (menu === 'karyawan') {
    formHtml += `<div class="form-group">`;
    formHtml += `<label>Daftar Situs</label>`;
    formHtml += `<div class="settings-list-container" id="situsListContainer">`;
    situsList.forEach((situs, index) => {
      formHtml += `
        <div class="settings-list-item">
          <span>${situs}</span>
          <button class="btn-remove-item" onclick="removeSitus(${index})" title="Hapus Situs">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    });
    formHtml += `</div>`;
    formHtml += `
      <div class="settings-add-input">
        <input type="text" id="newSitusInput" placeholder="Tambah situs baru..." />
        <button onclick="addSitus()">Tambah</button>
      </div>
    `;
    formHtml += `</div>`;
  }

  if (menu === 'izin') {
    formHtml += `<div class="form-group">`;
    formHtml += `<label>Kategori Izin</label>`;
    formHtml += `<div class="settings-list-container" id="kategoriListContainer">`;
    kategoriIzinList.forEach((kategori, index) => {
      formHtml += `
        <div class="settings-list-item">
          <span>${kategori}</span>
          <button class="btn-remove-item" onclick="removeKategori(${index})" title="Hapus Kategori">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    });
    formHtml += `</div>`;
    formHtml += `
      <div class="settings-add-input">
        <input type="text" id="newKategoriInput" placeholder="Tambah kategori izin..." />
        <button onclick="addKategori()">Tambah</button>
      </div>
    `;
    formHtml += `</div>`;
  }

  if (menu === 'laporan') {
    formHtml += `<div class="form-group">`;
    formHtml += `<label>Pengaturan Pemotongan Bonus</label>`;
    formHtml += `<div id="bonusListContainer">`;
    
    if (bonusSettings.length === 0) {
      formHtml += `<div class="bonus-empty">Belum ada data bonus. Tambahkan sekarang.</div>`;
    } else {
      bonusSettings.forEach((bonus) => {
        formHtml += `
          <div class="bonus-item" data-id="${bonus.id}">
            <div class="bonus-range">
              <label>Mulai</label>
              <input type="number" class="bonus-min" value="${bonus.minMenit}" placeholder="0" min="0" />
              <label> &gt; </label>
              <label>Akhir</label>
              <input type="number" class="bonus-max" value="${bonus.maxMenit}" placeholder="0" min="0" />
              <label> menit</label>
            </div>
            <div class="bonus-result">
              <input type="text" class="bonus-keterangan" value="${bonus.keterangan}" placeholder="Keterangan / Bonus %" />
              <button class="btn-remove-bonus" onclick="removeBonus(${bonus.id})" title="Hapus Bonus">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        `;
      });
    }
    
    formHtml += `
      <button class="btn-add-bonus" onclick="addBonus()">+ Tambah</button>
    `;
    formHtml += `</div>`;
    formHtml += `</div>`;
  }

  body.innerHTML = formHtml;

  document.querySelectorAll('.settings-checkbox').forEach(cb => {
    cb.addEventListener('change', function() {
      const group = this.dataset.group;
      const checked = document.querySelectorAll(`.settings-checkbox[data-group="${group}"]:checked`);
      const values = Array.from(checked).map(el => el.value);
      document.getElementById(group).value = JSON.stringify(values);
      
      if (group === 'karyawan_columns') {
        localStorage.setItem(`settings_${group}`, JSON.stringify(values));
      }
    });
  });

  modal.classList.add('active');
}

window.addSitus = function() {
  const input = document.getElementById('newSitusInput');
  const value = input.value.trim();
  if (!value) {
    showToast('⚠️ Harap masukkan nama situs!', 'error');
    return;
  }
  if (situsList.includes(value)) {
    showToast('⚠️ Situs sudah ada!', 'warning');
    return;
  }
  situsList.push(value);
  saveSettingsToStorage();
  const menu = document.getElementById('settingsMenu').value;
  openSettingsModal(menu);
  updateSettingsPreview();
  updateSitusDropdown();
  updateFilterSitusDropdown();
};

window.removeSitus = function(index) {
  situsList.splice(index, 1);
  saveSettingsToStorage();
  const menu = document.getElementById('settingsMenu').value;
  openSettingsModal(menu);
  updateSettingsPreview();
  updateSitusDropdown();
  updateFilterSitusDropdown();
};

window.addKategori = function() {
  const input = document.getElementById('newKategoriInput');
  const value = input.value.trim();
  if (!value) {
    showToast('⚠️ Harap masukkan kategori izin!', 'error');
    return;
  }
  if (kategoriIzinList.includes(value)) {
    showToast('⚠️ Kategori sudah ada!', 'warning');
    return;
  }
  kategoriIzinList.push(value);
  saveSettingsToStorage();
  const menu = document.getElementById('settingsMenu').value;
  openSettingsModal(menu);
  updateSettingsPreview();
  updateKategoriDropdown();
};

window.removeKategori = function(index) {
  kategoriIzinList.splice(index, 1);
  saveSettingsToStorage();
  const menu = document.getElementById('settingsMenu').value;
  openSettingsModal(menu);
  updateSettingsPreview();
  updateKategoriDropdown();
};

function updateKategoriDropdown() {
  const select = document.getElementById('inputKeteranganIzin');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">Pilih Keterangan</option>';
  kategoriIzinList.forEach(kategori => {
    const option = document.createElement('option');
    option.value = kategori;
    option.textContent = kategori;
    select.appendChild(option);
  });
  if (kategoriIzinList.includes(currentValue)) {
    select.value = currentValue;
  }
}

window.addBonus = function() {
  const newBonus = {
    id: nextBonusId++,
    persen: 0,
    minMenit: 0,
    maxMenit: 0,
    keterangan: ''
  };
  bonusSettings.push(newBonus);
  saveSettingsToStorage();
  const menu = document.getElementById('settingsMenu').value;
  openSettingsModal(menu);
  updateSettingsPreview();
};

window.removeBonus = function(id) {
  if (bonusSettings.length <= 1) {
    showToast('⚠️ Minimal harus ada 1 data bonus!', 'warning');
    return;
  }
  bonusSettings = bonusSettings.filter(b => b.id !== id);
  saveSettingsToStorage();
  const menu = document.getElementById('settingsMenu').value;
  openSettingsModal(menu);
  updateSettingsPreview();
};

function saveBonusFromModal() {
  const bonusItems = document.querySelectorAll('.bonus-item');
  const newBonusList = [];
  
  let isValid = true;
  
  bonusItems.forEach((item) => {
    const minMenit = parseInt(item.querySelector('.bonus-min').value) || 0;
    const maxMenit = parseInt(item.querySelector('.bonus-max').value) || 0;
    const keterangan = item.querySelector('.bonus-keterangan').value.trim() || '';
    const id = parseInt(item.dataset.id) || nextBonusId++;
    
    let persen = 0;
    const persenMatch = keterangan.match(/(\d+)\s*%/);
    if (persenMatch) {
      persen = parseInt(persenMatch[1]);
    } else {
      const angkaMatch = keterangan.match(/(\d+)/);
      if (angkaMatch) {
        persen = parseInt(angkaMatch[1]);
      }
    }
    
    if (minMenit > maxMenit) {
      isValid = false;
      showToast('⚠️ Range menit tidak valid!', 'error');
      return;
    }
    
    if (minMenit < 0 || maxMenit < 0) {
      isValid = false;
      showToast('⚠️ Menit tidak boleh negatif!', 'error');
      return;
    }
    
    if (!keterangan) {
      isValid = false;
      showToast('⚠️ Harap isi keterangan bonus!', 'error');
      return;
    }
    
    newBonusList.push({ 
      id, 
      persen: persen, 
      minMenit, 
      maxMenit, 
      keterangan 
    });
  });
  
  if (!isValid) return false;
  
  for (let i = 0; i < newBonusList.length; i++) {
    for (let j = i + 1; j < newBonusList.length; j++) {
      const a = newBonusList[i];
      const b = newBonusList[j];
      if (a.minMenit <= b.maxMenit && b.minMenit <= a.maxMenit) {
        showToast('⚠️ Range bonus saling tumpang tindih!', 'error');
        return false;
      }
    }
  }
  
  bonusSettings = newBonusList;
  saveSettingsToStorage();
  updateSettingsPreview();
  return true;
}

function updateSettingsPreview() {
  const situsPreview = document.getElementById('settingsSitusPreview');
  if (situsPreview) {
    situsPreview.innerHTML = situsList.map(s => 
      `<span class="settings-tag">${s}</span>`
    ).join('');
  }
  const situsCount = document.getElementById('settingsSitusCount');
  if (situsCount) situsCount.textContent = situsList.length;
  
  const kategoriPreview = document.getElementById('settingsKategoriPreview');
  if (kategoriPreview) {
    kategoriPreview.innerHTML = kategoriIzinList.map(k => 
      `<span class="settings-tag">${k}</span>`
    ).join('');
  }
  const kategoriCount = document.getElementById('settingsKategoriCount');
  if (kategoriCount) kategoriCount.textContent = kategoriIzinList.length;
  
  const bonusPreview = document.getElementById('settingsBonusPreview');
  if (bonusPreview) {
    const colors = ['#fb923c', '#f87171', '#ef4444', '#fca5a5'];
    bonusPreview.innerHTML = bonusSettings.map((b, i) => {
      const color = colors[i % colors.length];
      const bgColor = i === 3 ? 'rgba(185,28,28,0.3)' : `rgba(239,68,68,0.2)`;
      return `<span class="settings-tag" style="background: ${bgColor}; color: ${color};">${b.keterangan} (${b.minMenit}-${b.maxMenit} menit)</span>`;
    }).join('');
  }
  const bonusCount = document.getElementById('settingsBonusCount');
  if (bonusCount) bonusCount.textContent = bonusSettings.length;
  
  const columnCount = document.getElementById('settingsColumnCount');
  if (columnCount) {
    const savedColumns = localStorage.getItem('settings_karyawan_columns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        if (Array.isArray(parsed) && parsed.length > 0) {
          columnCount.textContent = parsed.length;
        } else {
          columnCount.textContent = 11;
        }
      } catch(e) {
        columnCount.textContent = 11;
      }
    } else {
      columnCount.textContent = 11;
    }
  }

  const totalKaryawanEl = document.getElementById('settingsTotalKaryawan');
  if (totalKaryawanEl) {
    const total = karyawanData.filter(k => k.status === 'Aktif').length;
    totalKaryawanEl.textContent = total;
  }

  const kuotaIzin = getKuotaIzinPerHari();
  const kuotaEl = document.getElementById('settingsKuotaIzin');
  if (kuotaEl) {
    kuotaEl.textContent = kuotaIzin + ' menit';
  }
}

function saveSettings() {
  const menu = document.getElementById('settingsMenu').value;
  const fields = document.querySelectorAll('.settings-field');
  const checkboxes = document.querySelectorAll('.settings-checkbox');

  if (menu !== 'karyawan') {
    fields.forEach(field => {
      if (field.type !== 'checkbox-group' && field.id !== 'settingsMenu') {
        localStorage.setItem(`settings_${field.id}`, field.value);
      }
    });
  }

  if (menu !== 'karyawan') {
    const checkboxGroups = {};
    
    document.querySelectorAll('.settings-checkbox:checked').forEach(cb => {
      const group = cb.dataset.group;
      if (!checkboxGroups[group]) checkboxGroups[group] = [];
      checkboxGroups[group].push(cb.value);
    });

    document.querySelectorAll('.settings-checkbox').forEach(cb => {
      const group = cb.dataset.group;
      const values = checkboxGroups[group] || [];
      localStorage.setItem(`settings_${group}`, JSON.stringify(values));
    });

    if (menu === 'karyawan') {
      const allColumns = ['ID', 'Foto', 'Nama', 'Inisial', 'Situs', 'Posisi', 'Telepon', 'Tanggal Join', 'Masa Kerja', 'Status', 'Aksi'];
      const savedCols = checkboxGroups['karyawan_columns'] || [];
      if (savedCols.length === allColumns.length || savedCols.length === 0) {
        localStorage.setItem('settings_karyawan_columns', JSON.stringify(allColumns));
      } else {
        localStorage.setItem('settings_karyawan_columns', JSON.stringify(savedCols));
      }
    }
  }

  if (menu === 'laporan') {
    if (!saveBonusFromModal()) {
      return;
    }
  }

  closeSettingsModal();

  updateSettingsPreview();

  if (menu === 'karyawan') {
    renderKaryawanHeader();
    renderKaryawan(document.getElementById('searchInput')?.value || '');
  }
  
  if (menu === 'izin') {
    renderIzinStaff();
    renderHistoryIzinHariIni();
    updateDashboardStats();
  }
  
  showToast('✅ Pengaturan berhasil disimpan!', 'success');
}

function closeSettingsModal() {
  const modal = document.getElementById('modalSettings');
  if (modal) {
    modal.classList.remove('active');
  }
}

function setupSettingsModalEvents() {
  const closeBtn = document.getElementById('closeSettingsModal');
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeSettingsModal();
    });
  }

  const cancelBtn = document.getElementById('cancelSettingsBtn');
  if (cancelBtn) {
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeSettingsModal();
    });
  }

  const submitBtn = document.getElementById('settingsSubmitBtn');
  if (submitBtn) {
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    newSubmitBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      saveSettings();
    });
  }

  const modal = document.getElementById('modalSettings');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeSettingsModal();
      }
    });
  }
}

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettings = saveSettings;
window.addSitus = addSitus;
window.removeSitus = removeSitus;
window.addKategori = addKategori;
window.removeKategori = removeKategori;
window.addBonus = addBonus;
window.removeBonus = removeBonus;

// ========== USER BADGE & LOGOUT ==========
function updateUserBadge() {
  const savedUser = localStorage.getItem('hrpro_current_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const nameEl = document.getElementById('userName');
      const roleEl = document.getElementById('userRole');
      if (nameEl) nameEl.textContent = user.name || user.email;
      if (roleEl) roleEl.textContent = user.role || 'User';
    } catch(e) {
      console.error('Error parsing user data:', e);
    }
  }
}

function handleLogout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    localStorage.removeItem('hrpro_current_user');
    localStorage.removeItem('hrpro_last_page');
    localStorage.removeItem('hrpro_filter_situs');
    localStorage.removeItem('hrpro_filter_posisi');
    window.location.href = 'login.html';
  }
}

// ========== EDIT USER FUNCTIONS ==========
function openEditUserModal(userId) {
  const user = usersData.find(item => item.id === userId);
  if (!user) {
    return;
  }
  
  document.getElementById('editUserId').value = user.id;
  document.getElementById('editUserEmail').value = user.email;
  document.getElementById('editUserName').value = user.name || '';
  document.getElementById('editUserRole').value = user.role;
  document.getElementById('editUserStatus').value = user.status;
  
  const situsSelect = document.getElementById('editUserSitus');
  situsSelect.innerHTML = '';
  
  const situsOptions = situsList.length > 0 ? situsList : ['HR Pro Indonesia', 'WDBOS', 'Negri Slot'];
  situsOptions.forEach(s => {
    const option = document.createElement('option');
    option.value = s;
    option.textContent = s;
    situsSelect.appendChild(option);
  });
  
  if (user.situs) {
    situsSelect.value = user.situs;
  }
  
  document.getElementById('modalEditUser').classList.add('active');
}

function closeEditUserModal() {
  document.getElementById('modalEditUser').classList.remove('active');
  document.getElementById('formEditUser').reset();
}

async function saveEditUser(e) {
  e.preventDefault();
  
  const id = parseInt(document.getElementById('editUserId').value);
  const email = document.getElementById('editUserEmail').value.trim();
  const name = document.getElementById('editUserName').value.trim();
  const role = document.getElementById('editUserRole').value;
  const situs = document.getElementById('editUserSitus').value;
  const status = document.getElementById('editUserStatus').value;
  
  if (!email || !name || !role || !situs) {
    showToast('⚠️ Harap isi semua field!', 'error');
    return;
  }
  
  const userIndex = usersData.findIndex(item => item.id === id);
  if (userIndex === -1) {
    showToast('⚠️ User tidak ditemukan!', 'error');
    return;
  }
  
  usersData[userIndex] = {
    ...usersData[userIndex],
    name: name,
    role: role,
    situs: situs,
    status: status
  };
  
  if (USE_DATABASE && window.db && typeof window.db.saveUser === 'function') {
    try {
      await window.db.saveUser(usersData[userIndex]);
      console.log('✅ User updated in database');
    } catch(e) {
      console.error('Error saving user to database:', e);
      return;
    }
  }
  
  // Simpan ke localStorage
  localStorage.setItem('hrpro_users', JSON.stringify(usersData));
  
  closeEditUserModal();
  renderUsers();
  updateUserBadge();
  showToast('✅ User berhasil diupdate!', 'success');
}

window.editUser = function(id) {
  openEditUserModal(id);
};

// ========== SETUP EDIT USER EVENTS ==========
function setupEditUserEvents() {
  const closeBtn = document.getElementById('closeEditUserModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditUserModal);
  }
  
  const cancelBtn = document.getElementById('cancelEditUserBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditUserModal);
  }
  
  const modal = document.getElementById('modalEditUser');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeEditUserModal();
      }
    });
  }
  
  const form = document.getElementById('formEditUser');
  if (form) {
    form.addEventListener('submit', saveEditUser);
  }
}

// ========== SETUP ALL EVENTS ==========
function setupAllEvents() {
  setupKaryawanEvents();
  setupFilterKaryawanEvents();
  setupIzinEvents();
  setupLaporanEvents();
  setupUsersEvents();
  setupEditUserEvents();
  setupRolesEvents();
  setupStatCardEvents();
  setupSettingsModalEvents();
  setupExportEvents();
  
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    newBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleLogout();
    });
  }
}

// ========== SETUP STAT CARD EVENTS ==========
function setupStatCardEvents() {
  const statCards = document.querySelectorAll('.stat-card[data-page]');
  
  // Cek apakah user memiliki akses ke menu karyawan
  const hasAccessToKaryawan = canViewMenu('karyawan');
  console.log('🔑 Has access to Karyawan:', hasAccessToKaryawan);
  
  statCards.forEach(card => {
    // Buat salinan card untuk menghindari duplicate event listener
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    
    const page = newCard.dataset.page;
    
    // ===== PERBAIKAN: Jika card mengarah ke karyawan dan user tidak punya akses =====
    if (page === 'karyawan' && !hasAccessToKaryawan) {
      // Card tetap terlihat, tambahkan class disabled untuk styling
      newCard.classList.add('disabled');
      
      // Ubah teks link
      const linkEl = newCard.querySelector('.stat-link');
      if (linkEl) {
        linkEl.textContent = '🔒 Akses ditolak';
        linkEl.style.color = 'rgba(255,255,255,0.25)';
        linkEl.style.fontSize = '10px';
      }
      
      newCard.style.cursor = 'not-allowed';
      
      // Tambahkan event click yang hanya menampilkan toast
      newCard.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showToast('⚠️ Anda tidak memiliki izin untuk mengakses menu Karyawan!', 'error');
      });
      
      console.log('🔒 Stat card karyawan dinonaktifkan (tetap terlihat)');
      return;
    }
    
    // Untuk card yang diizinkan (bukan karyawan atau user punya akses)
    newCard.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const page = this.dataset.page;
      let situs = this.dataset.situs || '';
      let posisi = this.dataset.posisi || '';
      
      // Cek permission sebelum navigasi
      if (page === 'karyawan' && !canViewMenu('karyawan')) {
        showToast('⚠️ Anda tidak memiliki izin untuk mengakses menu Karyawan!', 'error');
        return;
      }
      
      console.log('🔍 Stat card diklik:', { situs, posisi, page });
      
      localStorage.removeItem('hrpro_filter_situs');
      localStorage.removeItem('hrpro_filter_posisi');
      
      if (situs && situs !== '') {
        localStorage.setItem('hrpro_filter_situs', situs);
        console.log('✅ Filter situs disimpan:', situs);
      }
      if (posisi && posisi !== '') {
        localStorage.setItem('hrpro_filter_posisi', posisi);
        console.log('✅ Filter posisi disimpan:', posisi);
      }
      
      localStorage.setItem('hrpro_from_dashboard', 'true');
      localStorage.setItem('hrpro_last_page', page);
      
      console.log('📦 Final localStorage:', {
        situs: localStorage.getItem('hrpro_filter_situs'),
        posisi: localStorage.getItem('hrpro_filter_posisi'),
        fromDashboard: localStorage.getItem('hrpro_from_dashboard')
      });
      
      window.location.href = page + '.html';
    });
    
    newCard.style.cursor = 'pointer';
  });
  
  console.log('✅ Stat card events sudah di-setup');
}

// ========== FUNGSI EXPORT DATA ==========

function exportToCSV(data, headers, filename) {
    if (!data || data.length === 0) {
        showToast('⚠️ Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            let value = row[header] || '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✅ Data berhasil diexport ke CSV!', 'success');
}

function exportToPDF(title, tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) {
        showToast('⚠️ Tabel tidak ditemukan!', 'error');
        return;
    }
    
    const tbody = table.querySelector('tbody');
    if (!tbody || tbody.children.length === 0 || tbody.children[0].innerHTML.includes('Tidak ada data')) {
        showToast('⚠️ Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    const originalTitle = document.title;
    document.title = title;
    
    const printContent = document.createElement('div');
    printContent.innerHTML = `
        <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; background: white; }
            .print-header { text-align: center; margin-bottom: 30px; }
            .print-header h1 { font-size: 24px; color: #1a1a2e; margin: 0; }
            .print-header p { color: #666; margin: 6px 0 0; font-size: 14px; }
            .print-table { width: 100%; border-collapse: collapse; font-size: 13px; }
            .print-table th { 
                background: #1a1a2e; 
                color: white; 
                padding: 10px 12px; 
                text-align: left; 
                font-weight: 600;
                border: 1px solid #1a1a2e;
            }
            .print-table td { 
                padding: 8px 12px; 
                border: 1px solid #e5e7eb; 
                color: #1f2937;
            }
            .print-table tr:nth-child(even) { background: #f9fafb; }
            .print-footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #e5e7eb; 
                color: #999; 
                font-size: 12px;
            }
            .status-badge { 
                display: inline-block; 
                padding: 2px 10px; 
                border-radius: 12px; 
                font-size: 11px; 
                font-weight: 600;
            }
            .status-badge.hadir { background: #d1fae5; color: #065f46; }
            .status-badge.izin { background: #fef3c7; color: #92400e; }
            .status-badge.alpha { background: #fecaca; color: #991b1b; }
            .status-badge.terlambat { background: #fed7aa; color: #9a3412; }
            .status-badge.izin-keluar { background: #fef3c7; color: #92400e; }
            .status-badge.kembali { background: #dbeafe; color: #1e40af; }
            @media print {
                body { padding: 20px; }
                .no-print { display: none; }
            }
        </style>
        <div class="print-header">
            <h1>${title}</h1>
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        ${table.outerHTML}
        <div class="print-footer">
            HR Pro - Laporan Dihasilkan Secara Otomatis
        </div>
    `;
    
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    
    window.print();
    
    document.body.innerHTML = originalBody;
    document.title = originalTitle;
    
    location.reload();
}

function exportKaryawanCSV() {
    const data = karyawanData.map(item => ({
        'ID': item.id,
        'Nama': item.name,
        'Inisial': item.initial,
        'Situs': item.division,
        'Posisi': item.position,
        'Telepon': item.phone,
        'Tanggal Join': formatDate(item.joinDate),
        'Masa Kerja': calculateMasaKerja(item.joinDate),
        'Status': item.status
    }));
    
    const headers = ['ID', 'Nama', 'Inisial', 'Situs', 'Posisi', 'Telepon', 'Tanggal Join', 'Masa Kerja', 'Status'];
    const filename = `Data_Karyawan_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(data, headers, filename);
}

function exportKaryawanPDF() {
    exportToPDF('Data Karyawan', 'karyawanTableBody', 'Data_Karyawan');
}

function exportIzinCSV() {
    const data = izinData.map(item => ({
        'Tanggal': formatDate(item.date),
        'Nama': item.name,
        'Inisial': item.initial,
        'Situs': item.division,
        'Posisi': item.position,
        'Status': item.status,
        'Jam Izin': item.jamIzin,
        'Keterangan': item.keterangan,
        'Jam Kembali': item.jamKembali || '-',
        'Durasi Izin': item.durasiIzin || '-'
    }));
    
    const headers = ['Tanggal', 'Nama', 'Inisial', 'Situs', 'Posisi', 'Status', 'Jam Izin', 'Keterangan', 'Jam Kembali', 'Durasi Izin'];
    const filename = `Data_Izin_Staff_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(data, headers, filename);
}

function exportIzinPDF() {
    exportToPDF('Laporan Izin Staff', 'izinTableBody', 'Data_Izin_Staff');
}

function exportLaporanCSV() {
    let tglMulai = document.getElementById('filterTglMulai')?.value || '';
    let tglAkhir = document.getElementById('filterTglAkhir')?.value || '';
    
    if (!tglMulai || !tglAkhir) {
        const periodText = document.getElementById('selectedPeriodText')?.textContent || '';
        if (periodText && periodText.includes(' - ')) {
            const parts = periodText.split(' - ');
            if (parts.length === 2) {
                const startParts = parts[0].split(' ');
                const endParts = parts[1].split(' ');
                if (startParts.length >= 3 && endParts.length >= 3) {
                    try {
                        const startDate = new Date(startParts.join(' '));
                        const endDate = new Date(endParts.join(' '));
                        if (!isNaN(startDate) && !isNaN(endDate)) {
                            tglMulai = startDate.toISOString().split('T')[0];
                            tglAkhir = endDate.toISOString().split('T')[0];
                        }
                    } catch(e) {}
                }
            }
        }
    }
    
    if (!tglMulai || !tglAkhir) {
        const visibleMulai = document.querySelector('input[type="date"][id*="Mulai"]')?.value;
        const visibleAkhir = document.querySelector('input[type="date"][id*="Akhir"]')?.value;
        if (visibleMulai && visibleAkhir) {
            tglMulai = visibleMulai;
            tglAkhir = visibleAkhir;
        }
    }
    
    if (!tglMulai || !tglAkhir) {
        const today = getTodayDate();
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        tglMulai = lastMonth.toISOString().split('T')[0];
        tglAkhir = today;
    }
    
    if (!tglMulai || !tglAkhir) {
        showToast('⚠️ Silakan pilih periode terlebih dahulu!', 'error');
        return;
    }
    
    const namaStaff = document.getElementById('filterNamaStaff')?.value?.trim() || '';
    const data = getLaporanData(tglMulai, tglAkhir, namaStaff);
    
    if (data.length === 0) {
        showToast('⚠️ Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    const exportData = data.map(item => {
        const hasil = getPemotonganBonus(item.totalDurasi);
        return {
            'Tanggal': formatDate(item.date),
            'Nama': item.name,
            'Situs': item.division,
            'Posisi': item.position,
            'Total Durasi Izin': formatDurasi(item.totalDurasi),
            'Pemotongan Bonus': hasil.status === 'Normal' ? '0%' : hasil.keterangan,
            'Status': hasil.status
        };
    });
    
    const headers = ['Tanggal', 'Nama', 'Situs', 'Posisi', 'Total Durasi Izin', 'Pemotongan Bonus', 'Status'];
    const filename = `Laporan_Izin_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(exportData, headers, filename);
}

function exportLaporanPDF() {
    const tglMulai = document.getElementById('filterTglMulai')?.value || '';
    const tglAkhir = document.getElementById('filterTglAkhir')?.value || '';
    const namaStaff = document.getElementById('filterNamaStaff')?.value?.trim() || '';
    
    if (!tglMulai || !tglAkhir) {
        showToast('⚠️ Silakan pilih periode terlebih dahulu!', 'error');
        return;
    }
    
    const data = getLaporanData(tglMulai, tglAkhir, namaStaff);
    
    if (data.length === 0) {
        showToast('⚠️ Tidak ada data untuk diexport!', 'warning');
        return;
    }
    
    exportToPDF('Laporan Izin Staff', 'laporanTableBody', 'Laporan_Izin');
}

function setupExportEvents() {
    document.getElementById('btnExportKaryawanCSV')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof exportKaryawanCSV === 'function') {
            exportKaryawanCSV();
        }
    });
    document.getElementById('btnExportKaryawanPDF')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof exportKaryawanPDF === 'function') {
            exportKaryawanPDF();
        }
    });
    
    document.getElementById('btnExportIzinCSV')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof exportIzinCSV === 'function') {
            exportIzinCSV();
        }
    });
    document.getElementById('btnExportIzinPDF')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof exportIzinPDF === 'function') {
            exportIzinPDF();
        }
    });
    
    document.getElementById('btnExportLaporanCSV')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof exportLaporanCSV === 'function') {
            exportLaporanCSV();
        }
    });
    document.getElementById('btnExportLaporanPDF')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof exportLaporanPDF === 'function') {
            exportLaporanPDF();
        }
    });
    
    console.log('✅ Export events sudah di-setup');
}

window.exportKaryawanCSV = exportKaryawanCSV;
window.exportKaryawanPDF = exportKaryawanPDF;
window.exportIzinCSV = exportIzinCSV;
window.exportIzinPDF = exportIzinPDF;
window.exportLaporanCSV = exportLaporanCSV;
window.exportLaporanPDF = exportLaporanPDF;

// ========== SETUP NAVIGATION & PERMISSIONS ==========
function setupNavigation() {
    const savedUser = localStorage.getItem('hrpro_current_user');
    if (!savedUser) {
        console.log('⚠️ No user logged in');
        return;
    }
    
    try {
        const user = JSON.parse(savedUser);
        const users = JSON.parse(localStorage.getItem('hrpro_users')) || [];
        const existing = users.find(u => u.email === user.email);
        
        if (!existing) {
            console.log('⚠️ User not found in users list');
            return;
        }
        
        const userRole = existing.role || 'User';
        console.log(`👤 User role: ${userRole}`);
        
        const perms = getUserPermissions();
        let allowedMenus = perms.menus;
        
        console.log(`✅ Role "${userRole}" allowed menus:`, allowedMenus);
        
        if (userRole === 'Admin') {
            allowedMenus = allowedMenus.filter(menu => 
                menu !== 'roles' && menu !== 'pengaturan'
            );
            console.log(`🛠️ Admin role: filtered menus:`, allowedMenus);
        }
        
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const page = item.dataset.page;
            
            item.style.display = '';
            item.style.visibility = '';
            item.style.height = '';
            item.style.padding = '';
            item.style.margin = '';
            item.style.opacity = '';
            item.style.pointerEvents = '';
            item.style.overflow = '';
            item.style.minHeight = '';
            
            item.classList.remove('hidden-menu');
            
            if (allowedMenus.includes(page)) {
                item.style.display = 'flex';
                console.log(`✅ Menu "${page}" diizinkan untuk role "${userRole}"`);
            } else {
                item.classList.add('hidden-menu');
                console.log(`❌ Menu "${page}" disembunyikan untuk role "${userRole}"`);
            }
        });
        
        hideUnauthorizedElements(allowedMenus);
        applyPermissionsToActions();
        hideUnauthorizedLinks();
        
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.minHeight = 'calc(100vh - 40px)';
            sidebar.style.transition = 'none';
        }
        
    } catch(e) {
        console.error('Error setting up navigation:', e);
    }
}

function hideUnauthorizedElements(allowedMenus) {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    if (currentPage === 'karyawan' || currentPage === '') {
        const btnTambah = document.getElementById('btnTambahKaryawan');
        if (btnTambah) {
            if (!hasPermission('create')) {
                btnTambah.style.display = 'none';
                console.log('❌ Tombol Tambah Karyawan disembunyikan (no create permission)');
            }
        }
    }
    
    if (currentPage === 'izin') {
        const btnIzinKeluar = document.getElementById('btnIzinKeluar');
        const btnSudahKembali = document.getElementById('btnSudahKembali');
        if (btnIzinKeluar && !hasPermission('create')) {
            btnIzinKeluar.style.display = 'none';
        }
        if (btnSudahKembali && !hasPermission('edit')) {
            btnSudahKembali.style.display = 'none';
        }
    }
}

function hideUnauthorizedLinks() {
    const linkKelola = document.getElementById('linkKelolaKaryawan');
    if (linkKelola) {
        if (!canViewMenu('karyawan')) {
            linkKelola.style.display = 'none';
            const parent = linkKelola.closest('.card-header');
            if (parent) {
                let indicator = parent.querySelector('.access-denied-badge');
                if (!indicator) {
                    indicator = document.createElement('span');
                    indicator.className = 'access-denied-badge';
                    indicator.textContent = '🔒 Akses ditolak';
                    parent.appendChild(indicator);
                }
            }
            console.log('❌ Link "Kelola Karyawan" disembunyikan (no access)');
        }
    }
}

function applyPermissionsToActions() {
    const hasEdit = hasPermission('edit');
    const hasDelete = hasPermission('delete');
    
    if (!hasEdit) {
        document.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    if (!hasDelete) {
        document.querySelectorAll('.btn-action.delete').forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

// ========== SYNC FUNCTIONS ==========
async function syncAllData() {
    console.log('🔄 Syncing all data...');
    
    try {
        // Sync Karyawan
        if (window.db && typeof window.db.getKaryawan === 'function') {
            const karyawanFromDB = await window.db.getKaryawan();
            if (karyawanFromDB && karyawanFromDB.length > 0) {
                const mappedKaryawan = karyawanFromDB.map(item => ({
                    id: item.id,
                    name: item.name,
                    initial: item.initial || '',
                    division: item.division,
                    position: item.position || '',
                    phone: item.phone || '',
                    joinDate: item.join_date || item.joinDate,
                    status: item.status || 'Aktif',
                    photo: item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3b82f6&color=fff&size=40`
                }));
                karyawanData = mappedKaryawan;
                localStorage.setItem('hrpro_karyawan_data', JSON.stringify(mappedKaryawan));
                console.log('✅ Karyawan synced from database:', karyawanData.length);
            } else {
                const localData = JSON.parse(localStorage.getItem('hrpro_karyawan_data') || '[]');
                if (localData.length > 0) {
                    karyawanData = localData;
                    console.log('📦 Using localStorage karyawan data:', karyawanData.length);
                }
            }
        }
        
        // Sync Izin
        if (window.db && typeof window.db.getIzin === 'function') {
            const izinFromDB = await window.db.getIzin();
            if (izinFromDB && izinFromDB.length > 0) {
                const mappedIzin = izinFromDB.map(item => ({
                    date: item.date,
                    name: item.name,
                    initial: item.initial || '',
                    division: item.division,
                    position: item.position || '',
                    status: item.status,
                    jamIzin: item.jam_izin,
                    keterangan: item.keterangan || '-',
                    jamKembali: item.jam_kembali || '-',
                    durasiIzin: item.durasi_izin || '-'
                }));
                izinData = mappedIzin;
                localStorage.setItem('hrpro_izin_data', JSON.stringify(mappedIzin));
                console.log('✅ Izin synced from database:', izinData.length);
            } else {
                const localIzin = JSON.parse(localStorage.getItem('hrpro_izin_data') || '[]');
                if (localIzin.length > 0) {
                    izinData = localIzin;
                    console.log('📦 Using localStorage izin data:', izinData.length);
                }
            }
        }
        
        // Sync Users
        if (window.db && typeof window.db.getUsers === 'function') {
            const usersFromDB = await window.db.getUsers();
            if (usersFromDB && usersFromDB.length > 0) {
                usersData = usersFromDB;
                localStorage.setItem('hrpro_users', JSON.stringify(usersFromDB));
                console.log('✅ Users synced from database:', usersData.length);
            } else {
                const localUsers = JSON.parse(localStorage.getItem('hrpro_users') || '[]');
                if (localUsers.length > 0) {
                    usersData = localUsers;
                    console.log('📦 Using localStorage users data:', usersData.length);
                }
            }
        }
        
        // Sync Roles
        if (window.db && typeof window.db.getRoles === 'function') {
            const rolesFromDB = await window.db.getRoles();
            if (rolesFromDB && rolesFromDB.length > 0) {
                rolesData = rolesFromDB;
                localStorage.setItem('hrpro_roles_data', JSON.stringify(rolesFromDB));
                console.log('✅ Roles synced from database:', rolesData.length);
            } else {
                const localRoles = JSON.parse(localStorage.getItem('hrpro_roles_data') || '[]');
                if (localRoles.length > 0) {
                    rolesData = localRoles;
                    console.log('📦 Using localStorage roles data:', rolesData.length);
                }
            }
        }
        
        // Refresh UI
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof renderHistoryIzinHariIni === 'function') renderHistoryIzinHariIni();
        if (typeof renderDataKaryawan === 'function') renderDataKaryawan();
        if (typeof updateTotalKaryawan === 'function') updateTotalKaryawan();
        if (typeof renderIzinStaff === 'function') renderIzinStaff();
        if (typeof renderUsers === 'function') renderUsers();
        if (typeof renderRoles === 'function') renderRoles();
        
        console.log('✅ All data synced successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error syncing data:', error);
        return false;
    }
}

// ========== INIT FUNCTIONS ==========
function initDashboard() {
  renderAttendance();
  renderHistoryIzinHariIni();
  renderDataKaryawan();
  renderEmployeeGrid();
  updateTotalKaryawan();
  updateStatistikAbsensi();
  updateDashboardStats();
  initChart();
  setupStatCardEvents();
  updateSettingsPreview();
}

function initKaryawan() {
  loadFilterFromStorage();
  renderKaryawanHeader();
  renderKaryawan();
  updateTotalKaryawan();
  renderDataKaryawan();
  setupKaryawanEvents();
  setupFilterKaryawanEvents();
  updateSitusDropdown();
  updateFilterSitusDropdown();
}

function initIzin() {
  renderIzinStaff();
  renderHistoryIzinHariIni();
  updateDashboardStats();
  setupIzinEvents();
  updateKategoriDropdown();
}

function initLaporan() {
  setDefaultFilterDate();
  setupLaporanEvents();
}

function initUsers() {
  renderUsers();
  setupUsersEvents();
}

function initRoles() {
  renderRoles();
  setupRolesEvents();
}

function initPengaturan() {
  updateSettingsPreview();
}

function updateStatistikAbsensi() {
  const today = getTodayDate();
  const todayData = absensiLengkapData.filter(a => a.date === today);
  const hadir = todayData.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
  const tidakHadir = karyawanData.filter(k => k.status === 'Aktif').length - hadir;
  
  const hadirEl = document.getElementById('hadirHariIni');
  const tidakEl = document.getElementById('tidakHadir');
  if (hadirEl) hadirEl.textContent = hadir.toLocaleString();
  if (tidakEl) tidakEl.textContent = tidakHadir.toLocaleString();
}

// ========== FUNGSI PENCARIAN GLOBAL ==========
function setupGlobalSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // Hapus event listener lama dengan clone
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('keyup', function(e) {
        const searchTerm = this.value.trim();
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        
        console.log(`🔍 Searching "${searchTerm}" on page: ${currentPage}`);
        
        switch(currentPage) {
            case 'izin':
                handleSearchIzin(searchTerm);
                break;
            case 'laporan':
                handleSearchLaporan(searchTerm);
                break;
            case 'users':
                handleSearchUsers(searchTerm);
                break;
            case 'karyawan':
                handleSearchKaryawan(searchTerm);
                break;
            default:
                // Default search untuk halaman lain
                break;
        }
    });
}

// ========== FUNGSI PENCARIAN IZIN ==========
function handleSearchIzin(searchTerm) {
    if (typeof izinData === 'undefined') return;
    
    const filterTglMulai = document.getElementById('filterIzinTglMulai')?.value || '';
    const filterTglAkhir = document.getElementById('filterIzinTglAkhir')?.value || '';
    
    let filtered = izinData;
    
    // Filter berdasarkan periode jika ada
    if (filterTglMulai && filterTglAkhir) {
        filtered = filtered.filter(item => 
            item.date >= filterTglMulai && item.date <= filterTglAkhir
        );
    }
    
    // Filter berdasarkan pencarian
    if (searchTerm !== '') {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.initial.toLowerCase().includes(term) ||
            item.division.toLowerCase().includes(term) ||
            item.position.toLowerCase().includes(term)
        );
    }
    
    // Update data dan render ulang
    if (typeof filteredDataIzin !== 'undefined') {
        filteredDataIzin = filtered;
        if (typeof currentPageIzin !== 'undefined') {
            currentPageIzin = 1;
        }
        if (typeof renderIzinWithPagination === 'function') {
            renderIzinWithPagination();
        } else if (typeof renderIzinStaff === 'function') {
            renderIzinStaff();
        }
    }
}

// ========== FUNGSI PENCARIAN LAPORAN ==========
function handleSearchLaporan(searchTerm) {
    const filterNamaStaff = document.getElementById('filterNamaStaff');
    if (filterNamaStaff) {
        filterNamaStaff.value = searchTerm;
    }
    
    const tglMulai = document.getElementById('filterTglMulai')?.value || '';
    const tglAkhir = document.getElementById('filterTglAkhir')?.value || '';
    
    if (tglMulai && tglAkhir && typeof renderLaporan === 'function') {
        if (typeof currentPageLaporan !== 'undefined') {
            currentPageLaporan = 1;
        }
        renderLaporan(tglMulai, tglAkhir, searchTerm);
    }
}

// ========== FUNGSI PENCARIAN USERS ==========
function handleSearchUsers(searchTerm) {
    if (typeof usersData === 'undefined') return;
    
    if (searchTerm === '') {
        filteredDataUsers = usersData;
    } else {
        const term = searchTerm.toLowerCase();
        filteredDataUsers = usersData.filter(item => 
            item.email.toLowerCase().includes(term) ||
            item.name.toLowerCase().includes(term) ||
            item.role.toLowerCase().includes(term) ||
            item.situs.toLowerCase().includes(term)
        );
    }
    
    if (typeof currentPageUsers !== 'undefined') {
        currentPageUsers = 1;
    }
    if (typeof renderUsersWithPagination === 'function') {
        renderUsersWithPagination();
    } else if (typeof renderUsers === 'function') {
        renderUsers();
    }
}

// ========== FUNGSI PENCARIAN KARYAWAN ==========
function handleSearchKaryawan(searchTerm) {
    if (typeof karyawanData === 'undefined') return;
    if (typeof renderKaryawan === 'function') {
        if (typeof currentPageKaryawan !== 'undefined') {
            currentPageKaryawan = 1;
        }
        renderKaryawan(searchTerm);
    }
}

// ========== PANGGIL SETUP GLOBAL SEARCH ==========
// Panggil di dalam main init
// Tambahkan di bagian akhir dashboard.js setelah setupAllEvents
if (document.getElementById('searchInput')) {
    setupGlobalSearch();
}

// ========== MAIN INIT ==========
(async function() {
  console.log('🚀 HATORI Group App starting...');
  console.log(`🔍 Running in: ${isElectron ? 'Electron (Desktop)' : 'Browser'}`);
  console.log(`🗄️ Database mode: ${USE_DATABASE ? 'Cloud (Supabase)' : 'Local Storage'}`);
  
  // Load data dari localStorage terlebih dahulu
  try {
    const savedKaryawan = localStorage.getItem('hrpro_karyawan_data');
    if (savedKaryawan) {
      const parsed = JSON.parse(savedKaryawan);
      if (Array.isArray(parsed) && parsed.length > 0) {
        karyawanData = parsed;
        console.log('✅ Karyawan loaded from localStorage:', karyawanData.length);
      }
    }
  } catch(e) { console.error('Error loading karyawan:', e); }
  
  try {
    const savedIzin = localStorage.getItem('hrpro_izin_data');
    if (savedIzin) {
      const parsed = JSON.parse(savedIzin);
      if (Array.isArray(parsed) && parsed.length > 0) {
        izinData = parsed;
        console.log('✅ Izin loaded from localStorage:', izinData.length);
      }
    }
  } catch(e) { console.error('Error loading izin:', e); }
  
  try {
    const savedUsers = localStorage.getItem('hrpro_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        usersData = parsed;
        console.log('✅ Users loaded from localStorage:', usersData.length);
      }
    }
  } catch(e) { console.error('Error loading users:', e); }
  
  try {
    const savedRoles = localStorage.getItem('hrpro_roles_data');
    if (savedRoles) {
      const parsed = JSON.parse(savedRoles);
      if (Array.isArray(parsed) && parsed.length > 0) {
        rolesData = parsed;
        console.log('✅ Roles loaded from localStorage:', rolesData.length);
      }
    }
  } catch(e) { console.error('Error loading roles:', e); }
  
  // Sync dengan database jika tersedia
  if (USE_DATABASE && window.db && typeof window.db.getKaryawan === 'function') {
    await syncAllData();
  }
  
  updateUserBadge();
  updateTotalKaryawan();
  updateStatistikAbsensi();
  updateDashboardStats();
  updateSettingsPreview();
  
  setupNavigation();
  
  setTimeout(function() {
    setupAllEvents();
  }, 300);
  
  const now = new Date();
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  const dateEl = document.getElementById('currentDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', options);
  
  console.log('✅ HATORI Group App ready!');
  console.log('📅 Tanggal hari ini:', getTodayDate());
  console.log('📊 Settings loaded:', { situsList, kategoriIzinList, bonusSettings });
  console.log('📊 Izin data:', izinData.length, 'items');
  console.log('📊 Karyawan data:', karyawanData.length, 'items');
  console.log('📊 Users data:', usersData.length, 'items');
  console.log('📊 Roles data:', rolesData.length, 'items');
})();