// ============================================
// db.js - Supabase Database Integration
// ============================================

let supabase = null;
let supabaseConfig = {
    url: '',
    key: ''
};
let isConnected = false;

// Initialize Supabase
async function initDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Try Electron config first
        if (window.electronAPI && typeof window.electronAPI.getSupabaseConfig === 'function') {
            try {
                const config = await window.electronAPI.getSupabaseConfig();
                if (config && config.url && config.key) {
                    supabaseConfig = config;
                    console.log('✅ Supabase config loaded from Electron');
                }
            } catch (e) {
                console.warn('⚠️ Could not get config from Electron:', e);
            }
        }

        // Fallback: localStorage
        if (!supabaseConfig.url || !supabaseConfig.key) {
            try {
                const savedConfig = localStorage.getItem('hrpro_supabase_config');
                if (savedConfig) {
                    const parsed = JSON.parse(savedConfig);
                    if (parsed.url && parsed.key) {
                        supabaseConfig = parsed;
                        console.log('✅ Supabase config loaded from localStorage');
                    }
                }
            } catch (e) {
                console.warn('⚠️ Could not load config from localStorage:', e);
            }
        }

        // If still no config, use default from environment
        if (!supabaseConfig.url || !supabaseConfig.key) {
            const defaultConfig = getDefaultConfig();
            if (defaultConfig.url && defaultConfig.key) {
                supabaseConfig = defaultConfig;
                console.log('✅ Using default config from environment');
            } else {
                console.warn('⚠️ No Supabase configuration found!');
                return false;
            }
        }

        // Initialize Supabase client
        const { createClient } = window.supabase;
        supabase = createClient(supabaseConfig.url, supabaseConfig.key);
        
        // Test connection
        const { data, error } = await supabase.from('karyawan').select('count').limit(1);
        if (error) {
            console.error('❌ Supabase connection failed:', error);
            isConnected = false;
            return false;
        }

        isConnected = true;
        console.log('✅ Supabase connected successfully!');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        isConnected = false;
        return false;
    }
}

function getDefaultConfig() {
    return {
        url: process.env.SUPABASE_URL || '',
        key: process.env.SUPABASE_KEY || ''
    };
}

function getSupabase() {
    return supabase;
}

function isDatabaseConnected() {
    return isConnected && supabase !== null;
}

// ========== GENERIC CRUD OPERATIONS ==========

async function getTableData(table, options = {}) {
    if (!isDatabaseConnected()) return { data: [], error: 'Database not connected' };
    
    try {
        let query = supabase.from(table).select('*');
        
        // Filters
        if (options.filters) {
            Object.keys(options.filters).forEach(key => {
                const value = options.filters[key];
                if (Array.isArray(value)) {
                    query = query.in(key, value);
                } else if (typeof value === 'object' && value.operator) {
                    query = query.filter(key, value.operator, value.value);
                } else {
                    query = query.eq(key, value);
                }
            });
        }
        
        // Ordering
        if (options.orderBy) {
            query = query.order(options.orderBy.field, { 
                ascending: options.orderBy.ascending !== false 
            });
        }
        
        // Limit
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error(`❌ Error fetching ${table}:`, error);
            return { data: [], error: error.message };
        }
        
        return { data: data || [], error: null };
    } catch (error) {
        console.error(`❌ Error fetching ${table}:`, error);
        return { data: [], error: error.message };
    }
}

async function saveTableData(table, data, idField = 'id') {
    if (!isDatabaseConnected()) return { error: 'Database not connected' };
    
    try {
        // Clean data - remove undefined and null values except id
        const cleanData = { ...data };
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined || cleanData[key] === null) {
                delete cleanData[key];
            }
        });
        
        const isUpdate = cleanData[idField] !== undefined && cleanData[idField] !== null && cleanData[idField] !== '';
        
        if (isUpdate) {
            const { data: result, error } = await supabase
                .from(table)
                .update({ ...cleanData, updated_at: new Date().toISOString() })
                .eq(idField, cleanData[idField])
                .select();
            
            if (error) {
                console.error(`❌ Error updating ${table}:`, error);
                return { error: error.message };
            }
            return { data: result?.[0] || null, error: null };
        } else {
            const { data: result, error } = await supabase
                .from(table)
                .insert([{ ...cleanData, created_at: new Date().toISOString() }])
                .select();
            
            if (error) {
                console.error(`❌ Error inserting ${table}:`, error);
                return { error: error.message };
            }
            return { data: result?.[0] || null, error: null };
        }
    } catch (error) {
        console.error(`❌ Error saving ${table}:`, error);
        return { error: error.message };
    }
}

async function deleteTableData(table, id, idField = 'id') {
    if (!isDatabaseConnected()) return { error: 'Database not connected' };
    
    try {
        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq(idField, id)
            .select();
        
        if (error) {
            console.error(`❌ Error deleting ${table}:`, error);
            return { error: error.message };
        }
        return { data: data?.[0] || null, error: null };
    } catch (error) {
        console.error(`❌ Error deleting ${table}:`, error);
        return { error: error.message };
    }
}

// ========== SPECIFIC DATA OPERATIONS ==========

// Karyawan
async function getKaryawan() {
    const result = await getTableData('karyawan', {
        orderBy: { field: 'name', ascending: true }
    });
    return result.data;
}

async function saveKaryawan(data) {
    const result = await saveTableData('karyawan', data, 'id');
    return result.data;
}

async function deleteKaryawan(id) {
    const result = await deleteTableData('karyawan', id, 'id');
    return result.data;
}

// Izin
async function getIzin(options = {}) {
    const result = await getTableData('izin', {
        orderBy: { field: 'date', ascending: false },
        ...options
    });
    return result.data;
}

async function saveIzin(data) {
    // Generate ID if not exists
    if (!data.id) {
        data.id = crypto.randomUUID ? crypto.randomUUID() : 
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }
    const result = await saveTableData('izin', data, 'id');
    return result.data;
}

async function deleteIzin(id) {
    const result = await deleteTableData('izin', id, 'id');
    return result.data;
}

// Users
async function getUsers() {
    const result = await getTableData('users', {
        orderBy: { field: 'email', ascending: true }
    });
    return result.data;
}

async function saveUser(data) {
    const result = await saveTableData('users', data, 'id');
    return result.data;
}

async function deleteUser(id) {
    const result = await deleteTableData('users', id, 'id');
    return result.data;
}

// Roles
async function getRoles() {
    const result = await getTableData('roles', {
        orderBy: { field: 'role_name', ascending: true }
    });
    return result.data;
}

async function saveRole(data) {
    const result = await saveTableData('roles', data, 'id');
    return result.data;
}

async function deleteRole(id) {
    const result = await deleteTableData('roles', id, 'id');
    return result.data;
}

// Settings
async function getSettings() {
    const result = await getTableData('settings');
    const settingsMap = {};
    result.data.forEach(item => {
        settingsMap[item.key] = item.value;
    });
    return settingsMap;
}

async function saveSetting(key, value) {
    const { data, error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .select();
    
    if (error) {
        console.error('❌ Error saving setting:', error);
        return null;
    }
    return data?.[0] || null;
}

// ========== EXPORT ==========

// Expose globally
window.db = {
    initDatabase,
    getSupabase,
    isDatabaseConnected,
    getKaryawan,
    saveKaryawan,
    deleteKaryawan,
    getIzin,
    saveIzin,
    deleteIzin,
    getUsers,
    saveUser,
    deleteUser,
    getRoles,
    saveRole,
    deleteRole,
    getSettings,
    saveSetting,
    getTableData,
    saveTableData,
    deleteTableData
};

console.log('✅ Database module loaded');