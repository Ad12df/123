// ========== FIREBASE CONFIGURATION ========== //
// Configuración de Firebase para BiblioDigital
// Las claves de Firebase son públicas y seguras cuando se usan con reglas de seguridad de Firestore

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClLsoeqFvPsKfEHxmizLbJV14Xoh3YCp10",
  authDomain: "bibliotecadigital-ae9a3.firebaseapp.com",
  projectId: "bibliotecadigital-ae9a3",
  storageBucket: "bibliotecadigital-ae9a3.firebasestorage.app",
  messagingSenderId: "660001533029",
  appId: "1:660001533029:web:49f61c7907999cb321ea8c",
  measurementId: "G-3S2LVH8EQZ"
};

// Firebase ready promise
window.firebaseReady = new Promise((resolve) => {
  window._resolveFirebaseReady = resolve;
});

// Load Firebase SDK from CDN
(function() {
  // Create script elements for Firebase SDK
  const scripts = [
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js'
  ];
  
  let loadedCount = 0;
  let hasError = false;
  
  scripts.forEach((src, index) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // Ensure scripts load in order
    
    script.onload = () => {
      loadedCount++;
      
      // Initialize Firebase after all scripts are loaded
      if (loadedCount === scripts.length && typeof firebase !== 'undefined') {
        try {
          // Initialize Firebase
          if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
          }
          
          // Make Firebase and services available globally
          window.firebase = firebase;
          window.auth = firebase.auth();
          window.db = firebase.firestore();
          window.storage = firebase.storage();
          
          console.log('✅ Firebase inicializado correctamente');
          window._resolveFirebaseReady(true);
        } catch (error) {
          console.error('Error al inicializar Firebase:', error);
          console.log('ℹ️ Continuando con almacenamiento local únicamente');
          window._resolveFirebaseReady(false);
        }
      }
    };
    
    script.onerror = () => {
      if (!hasError) {
        hasError = true;
        console.log('ℹ️ Firebase no disponible, usando almacenamiento local');
        window._resolveFirebaseReady(false);
      }
    };
    
    document.head.appendChild(script);
  });
  
  // Timeout after 5 seconds
  setTimeout(() => {
    if (loadedCount < scripts.length) {
      console.log('⏱️ Timeout cargando Firebase, usando almacenamiento local');
      window._resolveFirebaseReady(false);
    }
  }, 5000);
})();
