# BiblioDigital - Biblioteca Digital Personal

Una aplicación web moderna de biblioteca digital con almacenamiento local, temas personalizables y acceso sin autenticación.

## 🚀 Características

- ✅ **Acceso libre** - Explora sin iniciar sesión
- ✅ **Almacenamiento local** - localStorage + IndexedDB
- ✅ **6 temas modernos** - Clásico, Oscuro, Sepia, Océano, Bosque, Púrpura
- ✅ **Responsive** - Funciona en móviles, tablets y escritorio
- ✅ **Subida de libros** - Con portadas personalizadas (requiere login)

## 📖 Documentación

Para documentación completa, consulta [replit.md](./replit.md)

## ▶️ Inicio Rápido

### Desarrollo Local
```bash
python3 server.py
```

Abre http://localhost:5000 en tu navegador.

### 🚀 Deployment a Firebase Hosting

1. **Instala Firebase CLI** (si aún no lo tienes):
```bash
npm install -g firebase-tools
```

2. **Inicia sesión en Firebase**:
```bash
firebase login
```

3. **Despliega la aplicación**:
```bash
firebase deploy --only hosting
```

Tu app estará disponible en: `https://bibliotecadigital-ae9a3.web.app`

#### Configuración Firebase
- **Project ID**: `bibliotecadigital-ae9a3`
- **Firestore**: Configurado con reglas en `config/firestore.rules`
- **Storage**: Configurado con reglas en `config/storage.rules`
- **Hosting**: Configurado en `firebase.json`

## 📁 Estructura del Proyecto

```
BiblioDigital/
├── index.html              # Página principal
├── favicon.svg/.ico        # Icono de la app
├── server.py               # Servidor de desarrollo local
├── firebase.json           # Configuración de Firebase
├── .firebaserc             # Project ID de Firebase
├── css/                    # Estilos
│   ├── styles.css
│   └── advanced-reader.css
├── js/                     # JavaScript
│   ├── app-localStorage.js
│   ├── firebase-config.js
│   ├── firebase-auth.js
│   └── ...
├── pages/                  # Páginas de la app
│   ├── catalog.html
│   ├── library.html
│   ├── reader.html
│   └── ...
└── config/                 # Configuración Firebase
    ├── firestore.rules
    ├── firestore.indexes.json
    └── storage.rules
```

---

**Versión 2.1** | Octubre 2025
