// ========== FIREBASE AUTHENTICATION SERVICE ========== //
// Sistema de autenticación completo con Firebase Auth

const FirebaseAuthService = {
    currentUser: null,

    async init() {
        // Esperar a que Firebase esté listo
        await window.firebaseReady;
        
        if (!window.auth) {
            console.log('⚠️ Firebase Auth no disponible');
            return false;
        }

        // Observar cambios en el estado de autenticación
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL
                };
                this.updateUserInfoUI();
                console.log('✅ Usuario autenticado:', this.currentUser.displayName);
            } else {
                this.currentUser = null;
                this.handlePageAuth();
            }
        });

        return true;
    },

    isAuthenticated() {
        return this.currentUser !== null;
    },

    async register(email, password, displayName) {
        try {
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Actualizar perfil con nombre de usuario
            await user.updateProfile({
                displayName: displayName || email.split('@')[0]
            });

            // Crear documento de usuario en Firestore
            await window.db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: displayName || email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                favorites: [],
                readingProgress: {}
            });

            console.log('✅ Usuario registrado exitosamente');
            return { success: true, user: user };
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            let errorMessage = 'Error al crear la cuenta';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email ya está registrado';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'La contraseña debe tener al menos 6 caracteres';
            }
            
            return { success: false, error: errorMessage };
        }
    },

    async login(email, password) {
        try {
            const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Inicio de sesión exitoso');
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            let errorMessage = 'Error al iniciar sesión';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No existe una cuenta con este email';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Contraseña incorrecta';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            }
            
            return { success: false, error: errorMessage };
        }
    },

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await window.auth.signInWithPopup(provider);
            
            // Verificar si es nuevo usuario y crear documento en Firestore
            const userDoc = await window.db.collection('users').doc(result.user.uid).get();
            if (!userDoc.exists) {
                await window.db.collection('users').doc(result.user.uid).set({
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    favorites: [],
                    readingProgress: {}
                });
            }
            
            console.log('✅ Inicio de sesión con Google exitoso');
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error);
            return { success: false, error: 'Error al iniciar sesión con Google' };
        }
    },

    async logout() {
        try {
            await window.auth.signOut();
            this.currentUser = null;
            console.log('✅ Sesión cerrada');
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    },

    async resetPassword(email) {
        try {
            await window.auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Error al enviar email de recuperación:', error);
            return { success: false, error: 'Error al enviar email de recuperación' };
        }
    },

    updateUserInfoUI() {
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');
        const userInitialsElement = document.getElementById('userInitials');

        if (this.currentUser) {
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.displayName;
            }
            if (userEmailElement) {
                userEmailElement.textContent = this.currentUser.email;
            }
            if (userInitialsElement) {
                const initials = this.currentUser.displayName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                userInitialsElement.textContent = initials;
            }
        }
    },

    handlePageAuth() {
        const path = window.location.pathname;
        const protectedPaths = ['library.html', 'settings.html'];
        const isProtected = protectedPaths.some(p => path.includes(p));

        if (isProtected && !this.isAuthenticated()) {
            window.location.href = '/pages/login.html';
        }
    }
};

// Exportar para uso global
window.FirebaseAuthService = FirebaseAuthService;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FirebaseAuthService.init());
} else {
    FirebaseAuthService.init();
}
