// ========== GOOGLE DRIVE UTILITIES ========== //

/**
 * BiblioDigital - Google Drive Integration
 * Utilities para trabajar con archivos almacenados en Google Drive
 */

// Carpeta base de Google Drive para los libros
const DRIVE_BASE_FOLDER = '0B62YiQW9g0Z2fmhiSFhGc0JrcmpEV2VJUzFCOG5IQldNVldkTWxJYXZmeUE4QkhpZS00VFk';

/**
 * Extrae el ID de archivo de una URL de Google Drive
 * @param {string} url - URL de Google Drive (compartida o normal)
 * @returns {string|null} - ID del archivo o null si no se encuentra
 */
function extractDriveFileId(url) {
    if (!url) return null;
    
    // Limpiar la URL
    url = url.trim();
    
    // Patrón para archivos: /d/{ID}/
    let match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // Patrón para carpetas: /folders/{ID}
    match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // Patrón para vistas alternativas: ?id={ID}
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // Si la URL parece ser solo el ID (25+ caracteres alfanuméricos)
    if (/^[a-zA-Z0-9_-]{25,}$/.test(url)) {
        return url;
    }
    
    return null;
}

/**
 * Convierte un ID de archivo de Google Drive a URL de vista previa (embed)
 * @param {string} fileId - ID del archivo en Google Drive
 * @returns {string} - URL para embed en iframe
 */
function getDrivePreviewUrl(fileId) {
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Convierte un ID de archivo de Google Drive a URL de descarga directa
 * @param {string} fileId - ID del archivo en Google Drive
 * @returns {string} - URL de descarga directa
 */
function getDriveDownloadUrl(fileId) {
    if (!fileId) return null;
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

/**
 * Convierte un ID de archivo de Google Drive a URL de visualización
 * @param {string} fileId - ID del archivo en Google Drive
 * @returns {string} - URL de visualización
 */
function getDriveViewUrl(fileId) {
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Verifica si una URL es de Google Drive
 * @param {string} url - URL a verificar
 * @returns {boolean} - true si es URL de Google Drive
 */
function isDriveUrl(url) {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
}

/**
 * Obtiene información básica de un archivo de Drive desde la URL
 * @param {string} url - URL del archivo en Google Drive
 * @returns {object} - Objeto con fileId, previewUrl, downloadUrl
 */
function parseDriveUrl(url) {
    const fileId = extractDriveFileId(url);
    
    if (!fileId) {
        return {
            valid: false,
            fileId: null,
            previewUrl: null,
            downloadUrl: null,
            viewUrl: null
        };
    }
    
    return {
        valid: true,
        fileId: fileId,
        previewUrl: getDrivePreviewUrl(fileId),
        downloadUrl: getDriveDownloadUrl(fileId),
        viewUrl: getDriveViewUrl(fileId)
    };
}

/**
 * Valida que un archivo de Google Drive sea accesible
 * @param {string} fileId - ID del archivo
 * @returns {Promise<boolean>} - true si el archivo es accesible
 */
async function validateDriveFile(fileId) {
    try {
        const previewUrl = getDrivePreviewUrl(fileId);
        const response = await fetch(previewUrl, { method: 'HEAD' });
        return response.ok || response.status === 200;
    } catch (error) {
        console.error('Error validating Drive file:', error);
        return false;
    }
}

/**
 * Crea un objeto de libro compatible con BiblioDigital desde un enlace de Drive
 * @param {string} driveUrl - URL del archivo en Google Drive
 * @param {object} metadata - Metadatos del libro (title, author, etc.)
 * @returns {object} - Objeto de libro listo para guardar
 */
function createBookFromDriveUrl(driveUrl, metadata = {}) {
    const driveInfo = parseDriveUrl(driveUrl);
    
    if (!driveInfo.valid) {
        throw new Error('URL de Google Drive no válida');
    }
    
    const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    return {
        id: bookId,
        title: metadata.title || 'Libro sin título',
        author: metadata.author || 'Autor desconocido',
        category: metadata.category || 'Sin categoría',
        description: metadata.description || 'Sin descripción',
        pages: metadata.pages || 0,
        year: metadata.year || new Date().getFullYear(),
        coverUrl: metadata.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
        
        // Información de Google Drive
        driveFileId: driveInfo.fileId,
        driveUrl: driveInfo.viewUrl,
        drivePreviewUrl: driveInfo.previewUrl,
        driveDownloadUrl: driveInfo.downloadUrl,
        
        // Flags
        isFromDrive: true,
        hasPDF: true,
        
        // Metadata
        uploadedBy: 'current_user',
        createdAt: new Date().toISOString()
    };
}

/**
 * Extrae el ID de carpeta de la URL de carpeta compartida de Google Drive
 * @param {string} folderUrl - URL de la carpeta compartida
 * @returns {string|null} - ID de la carpeta o null
 */
function extractDriveFolderId(folderUrl) {
    if (!folderUrl) return null;
    
    // Patrón para carpetas: /folders/{ID}
    const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.DriveUtils = {
        extractFileId: extractDriveFileId,
        getPreviewUrl: getDrivePreviewUrl,
        getDownloadUrl: getDriveDownloadUrl,
        getViewUrl: getDriveViewUrl,
        isDriveUrl: isDriveUrl,
        parseDriveUrl: parseDriveUrl,
        validateDriveFile: validateDriveFile,
        createBookFromDriveUrl: createBookFromDriveUrl,
        extractFolderId: extractDriveFolderId,
        DRIVE_BASE_FOLDER: DRIVE_BASE_FOLDER
    };
}
