// ============================================
// db.js - HATORI Group Database Module
// ============================================

// Konfigurasi Supabase
const SUPABASE_URL = 'https://umjwemosranxerroedek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtandlbW9zcmFueGVycm9lZGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzgyMjksImV4cCI6MjEwMDMxNDIyOX0.et11ee_3EszLE86ZsszT-2bWItyuP6F3w_noYdhNTP4';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtandlbW9zcmFueGVycm9lZGVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDczODIyOSwiZXhwIjoyMTAwMzE0MjI5fQ.5O-wX-ccOGYY9MNu-4tPg202GksYfYUBgnKgDntLYS0';

// ============================================
// INISIALISASI SUPABASE CLIENT
// ============================================

// Cek apakah Supabase sudah diinisialisasi
if (typeof window.supabase === 'undefined') {
    if (typeof supabase === 'function') {
        window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized with anon key');
    } else {
        console.warn('⚠️ Supabase library not loaded, using localStorage fallback');
    }
}

function getSupabaseClient() {
    if (typeof supabase !== 'undefined') {
        return supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
    return null;
}

// ============================================
// FUNGSI DATABASE - KARYAWAN
// ============================================

async function getKaryawan() {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, returning empty array');
            return [];
        }
        
        const { data, error } = await client
            .from('karyawan')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error fetching karyawan:', error);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error('Error in getKaryawan:', e);
        return [];
    }
}

async function saveKaryawan(karyawan) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, saving to localStorage fallback');
            saveKaryawanLocal(karyawan);
            return true;
        }
        
        const karyawanData = {
            id: karyawan.id,
            name: karyawan.name,
            initial: karyawan.initial || '',
            division: karyawan.division,
            position: karyawan.position || '',
            phone: karyawan.phone || '',
            join_date: karyawan.joinDate || new Date().toISOString().split('T')[0],
            status: karyawan.status || 'Aktif',
            photo: karyawan.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(karyawan.name)}&background=3b82f6&color=fff&size=40`
        };
        
        console.log('💾 Saving karyawan to database:', karyawanData);
        
        const { data: existing, error: checkError } = await client
            .from('karyawan')
            .select('id')
            .eq('id', karyawan.id)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing karyawan:', checkError);
        }
        
        let result;
        if (existing) {
            console.log('🔄 Updating existing karyawan:', karyawan.id);
            result = await client
                .from('karyawan')
                .update(karyawanData)
                .eq('id', karyawan.id);
        } else {
            console.log('➕ Inserting new karyawan:', karyawan.id);
            result = await client
                .from('karyawan')
                .insert(karyawanData);
        }
        
        if (result.error) {
            console.error('Error saving karyawan:', result.error);
            saveKaryawanLocal(karyawan);
            return false;
        }
        
        saveKaryawanLocal(karyawan);
        console.log('✅ Karyawan saved successfully:', karyawan.id);
        return true;
    } catch (e) {
        console.error('Error in saveKaryawan:', e);
        saveKaryawanLocal(karyawan);
        return false;
    }
}

async function deleteKaryawan(id) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, deleting from localStorage fallback');
            deleteKaryawanLocal(id);
            return true;
        }
        
        console.log('🗑️ Deleting karyawan from database:', id);
        
        const { error } = await client
            .from('karyawan')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting karyawan:', error);
            deleteKaryawanLocal(id);
            return false;
        }
        
        deleteKaryawanLocal(id);
        console.log('✅ Karyawan deleted successfully:', id);
        return true;
    } catch (e) {
        console.error('Error in deleteKaryawan:', e);
        deleteKaryawanLocal(id);
        return false;
    }
}

function saveKaryawanLocal(karyawan) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_karyawan_data') || '[]');
        const index = data.findIndex(k => k.id === karyawan.id);
        if (index >= 0) {
            data[index] = karyawan;
        } else {
            data.push(karyawan);
        }
        localStorage.setItem('hrpro_karyawan_data', JSON.stringify(data));
        console.log('✅ Karyawan saved to localStorage:', karyawan.id);
    } catch (e) {
        console.error('Error saving karyawan to localStorage:', e);
    }
}

function deleteKaryawanLocal(id) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_karyawan_data') || '[]');
        data = data.filter(k => k.id !== id);
        localStorage.setItem('hrpro_karyawan_data', JSON.stringify(data));
        console.log('✅ Karyawan deleted from localStorage:', id);
    } catch (e) {
        console.error('Error deleting karyawan from localStorage:', e);
    }
}

// ============================================
// FUNGSI DATABASE - IZIN
// ============================================

async function getIzin() {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, returning empty array');
            return [];
        }
        
        const { data, error } = await client
            .from('izin')
            .select('*')
            .order('date', { ascending: false })
            .order('jam_izin', { ascending: false });
        
        if (error) {
            console.error('Error fetching izin:', error);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error('Error in getIzin:', e);
        return [];
    }
}

async function saveIzin(izin) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, saving to localStorage fallback');
            saveIzinLocal(izin);
            return true;
        }
        
        const izinData = {
            date: izin.date,
            name: izin.name,
            initial: izin.initial || '',
            division: izin.division,
            position: izin.position || '',
            status: izin.status,
            jam_izin: izin.jamIzin,
            keterangan: izin.keterangan || '-',
            jam_kembali: izin.jamKembali || '-',
            durasi_izin: izin.durasiIzin || '-'
        };
        
        console.log('💾 Saving izin to database:', izinData);
        
        const { data: existing, error: checkError } = await client
            .from('izin')
            .select('id')
            .eq('date', izin.date)
            .eq('name', izin.name)
            .eq('jam_izin', izin.jamIzin)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing izin:', checkError);
        }
        
        let result;
        if (existing) {
            console.log('🔄 Updating existing izin:', existing.id);
            result = await client
                .from('izin')
                .update(izinData)
                .eq('id', existing.id);
        } else {
            console.log('➕ Inserting new izin');
            result = await client
                .from('izin')
                .insert(izinData);
        }
        
        if (result.error) {
            console.error('Error saving izin:', result.error);
            saveIzinLocal(izin);
            return false;
        }
        
        saveIzinLocal(izin);
        console.log('✅ Izin saved successfully for:', izin.name);
        return true;
    } catch (e) {
        console.error('Error in saveIzin:', e);
        saveIzinLocal(izin);
        return false;
    }
}

function saveIzinLocal(izin) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_izin_data') || '[]');
        const index = data.findIndex(i => 
            i.date === izin.date && 
            i.name === izin.name && 
            i.jamIzin === izin.jamIzin
        );
        if (index >= 0) {
            data[index] = izin;
        } else {
            data.push(izin);
        }
        localStorage.setItem('hrpro_izin_data', JSON.stringify(data));
        console.log('✅ Izin saved to localStorage');
    } catch (e) {
        console.error('Error saving izin to localStorage:', e);
    }
}

// ============================================
// FUNGSI DATABASE - USERS
// ============================================

async function getUsers() {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, returning empty array');
            return [];
        }
        
        const { data, error } = await client
            .from('users')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error('Error in getUsers:', e);
        return [];
    }
}

async function saveUser(user) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, saving to localStorage fallback');
            saveUserLocal(user);
            return true;
        }
        
        const userData = {
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role || 'User',
            situs: user.situs || 'HATORI Group Indonesia',
            status: user.status || 'Inactive',
            created_date: user.createdDate || new Date().toISOString().split('T')[0]
        };
        
        const { data: existing, error: checkError } = await client
            .from('users')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing user:', checkError);
        }
        
        let result;
        if (existing) {
            result = await client
                .from('users')
                .update(userData)
                .eq('id', existing.id);
        } else {
            result = await client
                .from('users')
                .insert(userData);
        }
        
        if (result.error) {
            console.error('Error saving user:', result.error);
            saveUserLocal(user);
            return false;
        }
        
        saveUserLocal(user);
        console.log('✅ User saved:', user.email);
        return true;
    } catch (e) {
        console.error('Error in saveUser:', e);
        saveUserLocal(user);
        return false;
    }
}

async function saveUsersData(users) {
    try {
        for (const user of users) {
            await saveUser(user);
        }
        return true;
    } catch (e) {
        console.error('Error in saveUsersData:', e);
        return false;
    }
}

// ============================================
// PERBAIKAN: DELETE USER
// ============================================

async function deleteUser(id) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, deleting from localStorage fallback');
            deleteUserLocal(id);
            return true;
        }
        
        console.log('🗑️ Deleting user from database:', id);
        
        const { error } = await client
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting user:', error);
            deleteUserLocal(id);
            return false;
        }
        
        deleteUserLocal(id);
        console.log('✅ User deleted successfully:', id);
        return true;
    } catch (e) {
        console.error('Error in deleteUser:', e);
        deleteUserLocal(id);
        return false;
    }
}

function deleteUserLocal(id) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_users') || '[]');
        data = data.filter(u => u.id !== id);
        localStorage.setItem('hrpro_users', JSON.stringify(data));
        console.log('✅ User deleted from localStorage:', id);
    } catch (e) {
        console.error('Error deleting user from localStorage:', e);
    }
}

function saveUserLocal(user) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_users') || '[]');
        const index = data.findIndex(u => u.email === user.email);
        if (index >= 0) {
            data[index] = user;
        } else {
            data.push(user);
        }
        localStorage.setItem('hrpro_users', JSON.stringify(data));
        console.log('✅ User saved to localStorage:', user.email);
    } catch (e) {
        console.error('Error saving user to localStorage:', e);
    }
}

// ============================================
// FUNGSI DATABASE - ROLES
// ============================================

async function getRoles() {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, returning empty array');
            return [];
        }
        
        const { data, error } = await client
            .from('roles')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) {
            console.error('Error fetching roles:', error);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error('Error in getRoles:', e);
        return [];
    }
}

async function saveRole(role) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, saving to localStorage fallback');
            saveRoleLocal(role);
            return true;
        }
        
        const roleData = {
            role_name: role.roleName,
            menus: role.menus || [],
            permissions: role.permissions || [],
            status: role.status || 'Active'
        };
        
        console.log('💾 Saving role to database:', roleData);
        
        const { data: existing, error: checkError } = await client
            .from('roles')
            .select('id')
            .eq('role_name', role.roleName)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing role:', checkError);
        }
        
        let result;
        if (existing) {
            console.log('🔄 Updating existing role:', existing.id);
            result = await client
                .from('roles')
                .update(roleData)
                .eq('id', existing.id);
        } else {
            console.log('➕ Inserting new role');
            result = await client
                .from('roles')
                .insert(roleData);
        }
        
        if (result.error) {
            console.error('Error saving role:', result.error);
            saveRoleLocal(role);
            return false;
        }
        
        saveRoleLocal(role);
        console.log('✅ Role saved successfully:', role.roleName);
        return true;
    } catch (e) {
        console.error('Error in saveRole:', e);
        saveRoleLocal(role);
        return false;
    }
}

async function saveRolesData(roles) {
    try {
        for (const role of roles) {
            await saveRole(role);
        }
        return true;
    } catch (e) {
        console.error('Error in saveRolesData:', e);
        return false;
    }
}

// ============================================
// PERBAIKAN: DELETE ROLE
// ============================================

async function deleteRole(id) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, deleting from localStorage fallback');
            deleteRoleLocal(id);
            return true;
        }
        
        console.log('🗑️ Deleting role from database:', id);
        
        const { error } = await client
            .from('roles')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting role:', error);
            deleteRoleLocal(id);
            return false;
        }
        
        deleteRoleLocal(id);
        console.log('✅ Role deleted successfully:', id);
        return true;
    } catch (e) {
        console.error('Error in deleteRole:', e);
        deleteRoleLocal(id);
        return false;
    }
}

function deleteRoleLocal(id) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_roles_data') || '[]');
        data = data.filter(r => r.id !== id);
        localStorage.setItem('hrpro_roles_data', JSON.stringify(data));
        console.log('✅ Role deleted from localStorage:', id);
    } catch (e) {
        console.error('Error deleting role from localStorage:', e);
    }
}

function saveRoleLocal(role) {
    try {
        let data = JSON.parse(localStorage.getItem('hrpro_roles_data') || '[]');
        const index = data.findIndex(r => r.roleName === role.roleName);
        if (index >= 0) {
            data[index] = role;
        } else {
            data.push(role);
        }
        localStorage.setItem('hrpro_roles_data', JSON.stringify(data));
        console.log('✅ Role saved to localStorage:', role.roleName);
    } catch (e) {
        console.error('Error saving role to localStorage:', e);
    }
}

// ============================================
// FUNGSI DATABASE - SETTINGS
// ============================================

async function getSettings() {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, returning empty object');
            return {};
        }
        
        const { data, error } = await client
            .from('settings')
            .select('*');
        
        if (error) {
            console.error('Error fetching settings:', error);
            return {};
        }
        
        const settings = {};
        if (data) {
            data.forEach(item => {
                settings[item.key] = item.value;
            });
        }
        return settings;
    } catch (e) {
        console.error('Error in getSettings:', e);
        return {};
    }
}

async function saveSetting(key, value) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, saving to localStorage fallback');
            saveSettingLocal(key, value);
            return true;
        }
        
        const { data: existing, error: checkError } = await client
            .from('settings')
            .select('id')
            .eq('key', key)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing setting:', checkError);
        }
        
        let result;
        if (existing) {
            result = await client
                .from('settings')
                .update({ value: value })
                .eq('id', existing.id);
        } else {
            result = await client
                .from('settings')
                .insert({ key: key, value: value });
        }
        
        if (result.error) {
            console.error('Error saving setting:', result.error);
            saveSettingLocal(key, value);
            return false;
        }
        
        saveSettingLocal(key, value);
        console.log('✅ Setting saved:', key);
        return true;
    } catch (e) {
        console.error('Error in saveSetting:', e);
        saveSettingLocal(key, value);
        return false;
    }
}

function saveSettingLocal(key, value) {
    try {
        localStorage.setItem(`settings_${key}`, JSON.stringify(value));
        console.log('✅ Setting saved to localStorage:', key);
    } catch (e) {
        console.error('Error saving setting to localStorage:', e);
    }
}

// ============================================
// FUNGSI DATABASE - ABSENSI (Opsional)
// ============================================

async function getAbsensi() {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available, returning empty array');
            return [];
        }
        
        const { data, error } = await client
            .from('absensi')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) {
            console.error('Error fetching absensi:', error);
            return [];
        }
        
        return data || [];
    } catch (e) {
        console.error('Error in getAbsensi:', e);
        return [];
    }
}

async function saveAbsensi(absensi) {
    try {
        const client = getSupabaseClient() || window.supabase;
        if (!client) {
            console.warn('⚠️ Supabase not available');
            return false;
        }
        
        const absensiData = {
            date: absensi.date,
            name: absensi.name,
            division: absensi.division,
            position: absensi.position,
            status: absensi.status,
            masuk: absensi.masuk || '-',
            pulang: absensi.pulang || '-',
            total_jam: absensi.totalJam || '-'
        };
        
        const { error } = await client
            .from('absensi')
            .insert(absensiData);
        
        if (error) {
            console.error('Error saving absensi:', error);
            return false;
        }
        
        console.log('✅ Absensi saved for:', absensi.name);
        return true;
    } catch (e) {
        console.error('Error in saveAbsensi:', e);
        return false;
    }
}

// ============================================
// INISIALISASI DATABASE
// ============================================

async function initDatabase() {
    console.log('🗄️ Initializing database connection...');
    
    try {
        const settings = await getSettings();
        if (settings && Object.keys(settings).length > 0) {
            console.log('✅ Database connected successfully!');
            console.log('📊 Settings loaded:', Object.keys(settings).length, 'items');
        } else {
            console.log('⚠️ Database connected but no settings found');
        }
        return true;
    } catch (e) {
        console.error('❌ Database connection failed:', e);
        return false;
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.db = {
    getKaryawan,
    saveKaryawan,
    deleteKaryawan,
    
    getIzin,
    saveIzin,
    
    getUsers,
    saveUser,
    saveUsersData,
    deleteUser,
    
    getRoles,
    saveRole,
    saveRolesData,
    deleteRole,
    
    getSettings,
    saveSetting,
    
    getAbsensi,
    saveAbsensi,
    
    initDatabase
};

console.log('✅ Database module loaded successfully!');
console.log('📋 Available functions:', Object.keys(window.db).join(', '));