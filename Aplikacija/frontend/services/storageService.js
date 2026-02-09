import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = `https://ggftwvfmnsdksawqzcdl.supabase.co`;
const SUPABASE_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZnR3dmZtbnNka3Nhd3F6Y2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ5MzIsImV4cCI6MjA3NTAyMDkzMn0.-nLGO5FS8sl9hzPrZi9BbKZm0A9Uunt-4-tUyaWbN5M`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false
    }
});

function generateUniqueFileName(file) {
    const extension = file.name.split('.').pop();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
}

async function _upload(bucketName, folderPath, file) {
    if (!file || file.size === 0) {
        return { success: false, message: "Fajl nije pronađen ili je prazan." };
    }

    const uniqueFileName = generateUniqueFileName(file);
    const filePath = `${folderPath}/${uniqueFileName}`;

    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Supabase Upload Greška:", error);
            return { success: false, message: error.message || "Greška prilikom prenosa fajla na Supabase." };
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
        
        return { success: true, publicUrl: publicUrl };
    } catch (ex) {
        console.error("Opšta greška prilikom prenosa:", ex);
        return { success: false, message: ex.message || "Nepoznata greška prilikom prenosa fajla." };
    }
}

export async function uploadProfilePicture(userId, file) {
    if (!userId) return { success: false, message: "ID korisnika je obavezan za prenos slike profila." };
    return _upload('profilne_slike', userId, file);
}

export async function uploadDocument(porodiljaId, file) {
    if (!porodiljaId) return { success: false, message: "ID porodilje je obavezan za prenos dokumenta." };
    return _upload('dokumenta', porodiljaId, file);
}