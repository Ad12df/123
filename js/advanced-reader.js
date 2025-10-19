// ========== ADVANCED READER WITH FIRESTORE INTEGRATION ========== //

// PDF.js worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// State Management
let currentBook = null;
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let zoom = 1.0;
let annotations = [];
let isHighlightMode = false;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Wait for Firebase to be ready (or timeout)
    if (window.firebaseReady) {
        await window.firebaseReady;
    }
    
    if (window.db) {
        console.log('✅ Firestore disponible en el reader');
    } else {
        console.log('ℹ️ Firestore no disponible, usando modo local');
    }

    setupEventListeners();
    await loadBookData();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('btnBack').addEventListener('click', () => {
        window.location.href = '../pages/catalog.html';
    });
    
    document.getElementById('btnPrevPage').addEventListener('click', prevPage);
    document.getElementById('btnNextPage').addEventListener('click', nextPage);
    
    // Tools
    document.getElementById('btnHighlight').addEventListener('click', toggleHighlight);
    document.getElementById('btnNote').addEventListener('click', openNoteModal);
    document.getElementById('btnZoomIn').addEventListener('click', () => adjustZoom(0.1));
    document.getElementById('btnZoomOut').addEventListener('click', () => adjustZoom(-0.1));
    document.getElementById('btnSettings').addEventListener('click', toggleSettings);
    
    // Settings
    document.getElementById('fontSizeSlider').addEventListener('input', updateFontSize);
    document.getElementById('readingMode').addEventListener('change', updateReadingMode);
    document.getElementById('textOnlyMode').addEventListener('change', toggleTextOnly);
    document.getElementById('btnCloseSettings').addEventListener('click', toggleSettings);
    
    // Modal
    document.getElementById('btnCloseModal').addEventListener('click', closeNoteModal);
    document.getElementById('btnCancelNote').addEventListener('click', closeNoteModal);
    document.getElementById('btnSaveNote').addEventListener('click', saveNote);
    
    // Annotations Panel
    document.getElementById('btnClosePanel').addEventListener('click', () => {
        document.getElementById('annotationsPanel').classList.remove('active');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // File input
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

// Load Book Data
async function loadBookData() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    
    if (!bookId) {
        showMessage('No se especificó ningún libro');
        return;
    }
    
    // Try to load from Firestore first
    if (window.db) {
        try {
            const bookData = await loadFromFirestore(bookId);
            if (bookData) {
                currentBook = bookData;
                document.getElementById('bookTitle').textContent = bookData.title || 'Sin título';
                await loadPDF(bookData.pdfUrl || bookData.url);
                return;
            }
        } catch (error) {
            console.error('Error loading from Firestore:', error);
        }
    }
    
    // Fallback to localStorage
    try {
        const books = JSON.parse(localStorage.getItem('biblioBooks')) || [];
        currentBook = books.find(b => b.id === bookId);
        
        if (!currentBook) {
            showMessage('Libro no encontrado');
            return;
        }
        
        document.getElementById('bookTitle').textContent = currentBook.title || 'Sin título';
        
        // Verificar si el libro está en Google Drive
        if (currentBook.isFromDrive && currentBook.drivePreviewUrl) {
            console.log('📚 Cargando libro desde Google Drive:', currentBook.driveFileId);
            await loadPDFFromDrive(currentBook.drivePreviewUrl, currentBook.driveFileId);
        } else {
            // Try to load PDF from IndexedDB
            const pdfData = await getPDFFromIndexedDB(bookId);
            if (pdfData) {
                await loadPDF(pdfData);
            } else {
                showFileSelector();
            }
        }
    } catch (error) {
        console.error('Error loading book:', error);
        showMessage('Error al cargar el libro');
    }
}

// Load from Firestore
async function loadFromFirestore(bookId) {
    if (!window.db || !window.firebase) return null;
    
    try {
        const booksRef = window.db.collection('books');
        const querySnapshot = await booksRef.where('id', '==', bookId).get();
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        
        return null;
    } catch (error) {
        console.error('Error en Firestore:', error);
        return null;
    }
}

// Load PDF
async function loadPDF(pdfData) {
    try {
        showMessage('Cargando PDF...');
        
        const loadingTask = pdfjsLib.getDocument(pdfData);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        currentPage = getSavedPage() || 1;
        await renderPage(currentPage);
        
        hideMessage();
    } catch (error) {
        console.error('Error loading PDF:', error);
        showMessage('Error al cargar el PDF. Por favor, selecciona un archivo.');
        showFileSelector();
    }
}

// Nueva función para cargar PDFs desde Google Drive
async function loadPDFFromDrive(drivePreviewUrl, fileId) {
    try {
        showMessage('Cargando PDF desde Google Drive...');
        
        // Crear un iframe para mostrar el PDF de Google Drive
        const readerContent = document.getElementById('readerContent');
        readerContent.innerHTML = `
            <div class="drive-viewer-container" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
                <div class="drive-info" style="padding: 1rem; background: #f3f4f6; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
                        <svg style="display: inline-block; width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.35 10.04L18.67 8.1l-5.04-1.8L12 0 10.37 6.3 5.33 8.1l-.68 1.94L0 12l4.65 1.96.68 1.94 5.04 1.8L12 24l1.63-6.3 5.04-1.8.68-1.94L24 12l-4.65-1.96z"/>
                        </svg>
                        Libro cargado desde Google Drive
                    </p>
                </div>
                <iframe 
                    src="${drivePreviewUrl}" 
                    style="width: 100%; height: calc(100% - 60px); border: none; border-radius: 8px;"
                    allow="autoplay"
                    title="Visor de PDF de Google Drive">
                </iframe>
            </div>
        `;
        
        // Ocultar controles que no funcionan con iframe de Drive
        const toolbar = document.querySelector('.toolbar-center');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
        
        const toolbarRight = document.querySelector('.toolbar-right');
        if (toolbarRight) {
            // Ocultar solo los controles de zoom y anotaciones
            const zoomControls = toolbarRight.querySelectorAll('#btnZoomIn, #btnZoomOut, .zoom-level, #btnHighlight, #btnNote');
            zoomControls.forEach(el => el.style.display = 'none');
        }
        
        hideMessage();
        console.log('✅ PDF de Google Drive cargado exitosamente');
    } catch (error) {
        console.error('Error loading PDF from Drive:', error);
        showMessage('Error al cargar el PDF desde Google Drive. Verifica que el archivo sea público o esté compartido correctamente.');
    }
}

// Render Page
async function renderPage(pageNum) {
    if (!pdfDoc) return;
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: zoom * 1.5 });
    
    let canvas = document.getElementById('pdfCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'pdfCanvas';
        const container = document.getElementById('readerContent');
        container.innerHTML = '';
        container.appendChild(canvas);
    }
    
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Update UI
    document.getElementById('pageInfo').textContent = `${pageNum} / ${totalPages}`;
    document.getElementById('zoomLevel').textContent = `${Math.round(zoom * 100)}%`;
    
    // Save progress
    saveProgress(pageNum);
}

// Navigation
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
    }
}

// Zoom
function adjustZoom(delta) {
    zoom = Math.max(0.5, Math.min(2.0, zoom + delta));
    renderPage(currentPage);
}

// Highlight Mode
function toggleHighlight() {
    const btn = document.getElementById('btnHighlight');
    isHighlightMode = !isHighlightMode;
    btn.setAttribute('data-active', isHighlightMode);
}

// Notes
function openNoteModal() {
    const selection = window.getSelection().toString();
    if (selection) {
        document.getElementById('selectedText').textContent = selection;
    } else {
        document.getElementById('selectedText').textContent = 'No hay texto seleccionado';
    }
    document.getElementById('noteModal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
    document.getElementById('noteText').value = '';
}

function saveNote() {
    const noteText = document.getElementById('noteText').value;
    const selectedText = document.getElementById('selectedText').textContent;
    
    if (noteText) {
        const annotation = {
            page: currentPage,
            text: selectedText,
            note: noteText,
            timestamp: new Date().toISOString()
        };
        
        annotations.push(annotation);
        saveAnnotations();
        displayAnnotations();
        closeNoteModal();
        
        // Show annotations panel
        document.getElementById('annotationsPanel').classList.add('active');
    }
}

function displayAnnotations() {
    const list = document.getElementById('annotationsList');
    
    if (annotations.length === 0) {
        list.innerHTML = '<p class="empty-message">No hay anotaciones aún</p>';
        return;
    }
    
    list.innerHTML = annotations.map(ann => `
        <div class="annotation-item">
            <div class="annotation-text">"${ann.text}"</div>
            <div class="annotation-note">${ann.note}</div>
        </div>
    `).join('');
}

// Settings
function toggleSettings() {
    document.getElementById('settingsPanel').classList.toggle('active');
}

function updateFontSize(e) {
    const size = e.target.value;
    document.getElementById('fontSizeValue').textContent = `${size}px`;
    document.getElementById('readerContent').style.fontSize = `${size}px`;
}

function updateReadingMode(e) {
    const mode = e.target.value;
    const content = document.getElementById('readerContent');
    content.classList.remove('light', 'sepia', 'dark');
    content.classList.add(mode);
    
    // Update background color
    const colors = {
        light: '#ffffff',
        sepia: '#f4ecd8',
        dark: '#1a1a1a'
    };
    document.querySelector('.reader-container').style.background = colors[mode];
}

function toggleTextOnly(e) {
    // This would require PDF.js text layer implementation
    console.log('Text-only mode:', e.target.checked);
}

// Keyboard Shortcuts
function handleKeyboard(e) {
    if (e.key === 'ArrowLeft') prevPage();
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'h') toggleHighlight();
    if (e.key === 'n') openNoteModal();
    if (e.key === '+') adjustZoom(0.1);
    if (e.key === '-') adjustZoom(-0.1);
}

// File Upload
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        await loadPDF(event.target.result);
    };
    reader.readAsDataURL(file);
}

function showFileSelector() {
    const container = document.getElementById('readerContent');
    container.innerHTML = `
        <div class="loading-message">
            <p style="margin-bottom: 20px;">El PDF no está disponible localmente.</p>
            <button class="btn-primary" onclick="document.getElementById('fileInput').click()">
                Seleccionar archivo PDF
            </button>
        </div>
    `;
}

// Progress Tracking
function saveProgress(page) {
    if (!currentBook) return;
    
    const progress = {
        bookId: currentBook.id,
        page: page,
        totalPages: totalPages,
        lastRead: new Date().toISOString()
    };
    
    localStorage.setItem(`progress_${currentBook.id}`, JSON.stringify(progress));
}

function getSavedPage() {
    if (!currentBook) return 1;
    
    const saved = localStorage.getItem(`progress_${currentBook.id}`);
    if (saved) {
        const progress = JSON.parse(saved);
        return progress.page;
    }
    return 1;
}

// Annotations Storage
function saveAnnotations() {
    if (!currentBook) return;
    localStorage.setItem(`annotations_${currentBook.id}`, JSON.stringify(annotations));
}

function loadAnnotations() {
    if (!currentBook) return;
    
    const saved = localStorage.getItem(`annotations_${currentBook.id}`);
    if (saved) {
        annotations = JSON.parse(saved);
        displayAnnotations();
    }
}

// IndexedDB for PDFs
function getPDFFromIndexedDB(bookId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BiblioDigitalDB', 1);
        
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pdfs'], 'readonly');
            const store = transaction.objectStore('pdfs');
            const getRequest = store.get(bookId);
            
            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    resolve(getRequest.result.pdfData);
                } else {
                    resolve(null);
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pdfs')) {
                db.createObjectStore('pdfs', { keyPath: 'bookId' });
            }
        };
    });
}

// UI Helpers
function showMessage(message) {
    const container = document.getElementById('readerContent');
    container.innerHTML = `
        <div class="loading-message">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function hideMessage() {
    // Message will be replaced by PDF canvas
}

console.log('✅ Advanced Reader inicializado');
