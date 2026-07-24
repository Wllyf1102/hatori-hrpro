// ============================================
// pengaturan.js - Settings & Database Config
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Load saved config
    loadSavedConfig();
    
    // Save config
    document.getElementById('saveSupabaseConfig')?.addEventListener('click', function() {
        saveSupabaseConfig();
    });
    
    // Test connection
    document.getElementById('testSupabaseConnection')?.addEventListener('click', function() {
        testSupabaseConnection();
    });
    
    // Sync data
    document.getElementById('syncDataFromCloud')?.addEventListener('click', function() {
        syncDataFromCloud();
    });
});

function loadSavedConfig() {
    try {
        const saved = localStorage.getItem('hrpro_supabase_config');
        if (saved) {
            const config = JSON.parse(saved);
            if (config.url) document.getElementById('supabaseUrl').value = config.url;
            if (config.key) document.getElementById('supabaseKey').value = config.key;
        }
    } catch(e) {
        console.error('Error loading config:', e);
    }
}

function saveSupabaseConfig() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    
    if (!url || !key) {
        showStatus('⚠️ Harap isi URL dan Key!', 'error');
        return;
    }
    
    const config = { url, key };
    localStorage.setItem('hrpro_supabase_config', JSON.stringify(config));
    
    // Jika di Electron, kirim ke main process
    if (window.electronAPI && typeof window.electronAPI.setSupabaseConfig === 'function') {
        window.electronAPI.setSupabaseConfig(config);
    }
    
    showStatus('✅ Konfigurasi database berhasil disimpan!', 'success');
}

async function testSupabaseConnection() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    
    if (!url || !key) {
        showStatus('⚠️ Harap isi URL dan Key terlebih dahulu!', 'error');
        return;
    }
    
    try {
        showStatus('🔄 Menguji koneksi...', 'info');
        
        const { createClient } = window.supabase;
        const supabase = createClient(url, key);
        const { data, error } = await supabase.from('karyawan').select('count').limit(1);
        
        if (error) {
            showStatus('❌ Koneksi gagal: ' + error.message, 'error');
            return;
        }
        
        showStatus('✅ Koneksi berhasil! Database terhubung.', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

async function syncDataFromCloud() {
    if (!window.db || !window.db.isDatabaseConnected()) {
        showStatus('⚠️ Database belum terhubung! Silakan test connection terlebih dahulu.', 'error');
        return;
    }
    
    try {
        showStatus('🔄 Menyinkronkan data dari cloud...', 'info');
        
        // Sync Karyawan
        const karyawanData = await window.db.getKaryawan();
        if (karyawanData && Array.isArray(karyawanData)) {
            localStorage.setItem('hrpro_karyawan_data', JSON.stringify(karyawanData));
            if (typeof karyawanData !== 'undefined') window.karyawanData = karyawanData;
        }
        
        // Sync Izin
        const izinData = await window.db.getIzin();
        if (izinData && Array.isArray(izinData)) {
            localStorage.setItem('hrpro_izin_data', JSON.stringify(izinData));
            if (typeof izinData !== 'undefined') window.izinData = izinData;
        }
        
        // Sync Users
        const usersData = await window.db.getUsers();
        if (usersData && Array.isArray(usersData)) {
            localStorage.setItem('hrpro_users', JSON.stringify(usersData));
            if (typeof usersData !== 'undefined') window.usersData = usersData;
        }
        
        // Sync Roles
        const rolesData = await window.db.getRoles();
        if (rolesData && Array.isArray(rolesData)) {
            localStorage.setItem('hrpro_roles_data', JSON.stringify(rolesData));
            if (typeof rolesData !== 'undefined') window.rolesData = rolesData;
        }
        
        showStatus('✅ Data berhasil disinkronkan dari cloud!', 'success');
        
        // Refresh UI
        if (typeof refreshAllUI === 'function') refreshAllUI();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof renderKaryawan === 'function') renderKaryawan();
        if (typeof renderIzinStaff === 'function') renderIzinStaff();
        if (typeof renderUsers === 'function') renderUsers();
        if (typeof renderRoles === 'function') renderRoles();
        
    } catch (error) {
        showStatus('❌ Error sync data: ' + error.message, 'error');
    }
}

function showStatus(message, type = 'info') {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    
    el.style.display = 'block';
    el.textContent = message;
    
    const colors = {
        success: 'rgba(22,163,74,0.15)',
        error: 'rgba(220,38,38,0.15)',
        info: 'rgba(59,130,246,0.15)',
        warning: 'rgba(234,179,8,0.15)'
    };
    
    el.style.background = colors[type] || colors.info;
    el.style.border = '1px solid ' + (colors[type] || colors.info);
    el.style.color = '#ffffff';
    
    setTimeout(() => {
        el.style.display = 'none';
    }, 10000);
}