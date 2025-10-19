// ========== FIRESTORE DATABASE SERVICE ========== //
// Servicio para manejar la base de datos de libros en Firestore

const FirestoreService = {
    // Colección de libros
    BOOKS_COLLECTION: 'books',
    USERS_COLLECTION: 'users',

    // Obtener todos los libros
    async getAllBooks() {
        try {
            const snapshot = await window.db.collection(this.BOOKS_COLLECTION)
                .orderBy('createdAt', 'desc')
                .get();
            
            const books = [];
            snapshot.forEach(doc => {
                books.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📚 ${books.length} libros cargados desde Firestore`);
            return books;
        } catch (error) {
            console.error('Error al cargar libros:', error);
            return [];
        }
    },

    // Obtener libros del usuario actual
    async getUserBooks(userId) {
        try {
            const snapshot = await window.db.collection(this.BOOKS_COLLECTION)
                .where('uploadedBy', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const books = [];
            snapshot.forEach(doc => {
                books.push({ id: doc.id, ...doc.data() });
            });
            
            return books;
        } catch (error) {
            console.error('Error al cargar libros del usuario:', error);
            return [];
        }
    },

    // Obtener un libro por ID
    async getBook(bookId) {
        try {
            const doc = await window.db.collection(this.BOOKS_COLLECTION).doc(bookId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error al obtener libro:', error);
            return null;
        }
    },

    // Agregar nuevo libro
    async addBook(bookData) {
        try {
            const docRef = await window.db.collection(this.BOOKS_COLLECTION).add({
                ...bookData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Libro agregado a Firestore:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error al agregar libro:', error);
            return { success: false, error: error.message };
        }
    },

    // Actualizar libro
    async updateBook(bookId, updates) {
        try {
            await window.db.collection(this.BOOKS_COLLECTION).doc(bookId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Libro actualizado en Firestore');
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar libro:', error);
            return { success: false, error: error.message };
        }
    },

    // Eliminar libro
    async deleteBook(bookId) {
        try {
            await window.db.collection(this.BOOKS_COLLECTION).doc(bookId).delete();
            console.log('✅ Libro eliminado de Firestore');
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar libro:', error);
            return { success: false, error: error.message };
        }
    },

    // Buscar libros
    async searchBooks(query, category = 'all') {
        try {
            let ref = window.db.collection(this.BOOKS_COLLECTION);
            
            if (category !== 'all') {
                ref = ref.where('category', '==', category);
            }
            
            const snapshot = await ref.get();
            const allBooks = [];
            snapshot.forEach(doc => {
                allBooks.push({ id: doc.id, ...doc.data() });
            });
            
            // Filtrar por búsqueda en el cliente
            if (query && query.trim() !== '') {
                const searchTerm = query.toLowerCase();
                return allBooks.filter(book => 
                    book.title.toLowerCase().includes(searchTerm) ||
                    book.author.toLowerCase().includes(searchTerm) ||
                    book.description.toLowerCase().includes(searchTerm)
                );
            }
            
            return allBooks;
        } catch (error) {
            console.error('Error al buscar libros:', error);
            return [];
        }
    },

    // Agregar a favoritos
    async addToFavorites(userId, bookId) {
        try {
            await window.db.collection(this.USERS_COLLECTION).doc(userId).update({
                favorites: firebase.firestore.FieldValue.arrayUnion(bookId)
            });
            return { success: true };
        } catch (error) {
            console.error('Error al agregar a favoritos:', error);
            return { success: false, error: error.message };
        }
    },

    // Remover de favoritos
    async removeFromFavorites(userId, bookId) {
        try {
            await window.db.collection(this.USERS_COLLECTION).doc(userId).update({
                favorites: firebase.firestore.FieldValue.arrayRemove(bookId)
            });
            return { success: true };
        } catch (error) {
            console.error('Error al remover de favoritos:', error);
            return { success: false, error: error.message };
        }
    },

    // Obtener favoritos del usuario
    async getUserFavorites(userId) {
        try {
            const userDoc = await window.db.collection(this.USERS_COLLECTION).doc(userId).get();
            if (userDoc.exists) {
                const favorites = userDoc.data().favorites || [];
                
                // Obtener los libros favoritos
                if (favorites.length === 0) return [];
                
                const booksPromises = favorites.map(bookId => this.getBook(bookId));
                const books = await Promise.all(booksPromises);
                
                return books.filter(book => book !== null);
            }
            return [];
        } catch (error) {
            console.error('Error al obtener favoritos:', error);
            return [];
        }
    },

    // Guardar progreso de lectura
    async saveReadingProgress(userId, bookId, page) {
        try {
            await window.db.collection(this.USERS_COLLECTION).doc(userId).update({
                [`readingProgress.${bookId}`]: {
                    page: page,
                    lastRead: firebase.firestore.FieldValue.serverTimestamp()
                }
            });
            return { success: true };
        } catch (error) {
            console.error('Error al guardar progreso:', error);
            return { success: false };
        }
    },

    // Obtener progreso de lectura
    async getReadingProgress(userId, bookId) {
        try {
            const userDoc = await window.db.collection(this.USERS_COLLECTION).doc(userId).get();
            if (userDoc.exists) {
                const progress = userDoc.data().readingProgress || {};
                return progress[bookId] || null;
            }
            return null;
        } catch (error) {
            console.error('Error al obtener progreso:', error);
            return null;
        }
    }
};

// Exportar para uso global
window.FirestoreService = FirestoreService;
