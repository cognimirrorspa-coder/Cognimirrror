# 🚀 INSTRUCCIONES DE DEPLOYMENT

## ✅ PASO 1: BUILD DE PRODUCCIÓN

```bash
npm run build
```

Este comando creará la carpeta `dist/` con los archivos optimizados.

---

## ☁️ PASO 2: DEPLOY A FIREBASE HOSTING

```bash
firebase deploy --only hosting
```

**Resultado esperado:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/cogntech-2fca1/overview
Hosting URL: https://cogntech-2fca1.web.app
```

---

## 📦 PASO 3: PUSH A GITHUB

### Opción A: Si ya tienes repositorio configurado

```bash
git add .
git commit -m "✨ Sistema completo de análisis cognitivo implementado

- Memory Mirror con análisis de 8 métricas
- Digit Span Mirror (sensor verbal)
- Observer Dashboard para padres
- Persistencia Firebase completa
- Índice de auto-corrección implementado
- Historial cognitivo funcional"

git push origin main
```

### Opción B: Si es la primera vez (crear repositorio nuevo)

```bash
# 1. Inicializar Git
git init

# 2. Agregar archivos
git add .

# 3. Primer commit
git commit -m "🎉 Initial commit - CogniMirror con análisis cognitivo completo"

# 4. Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/cognimirror.git

# 5. Push
git branch -M main
git push -u origin main
```

---

## 🔥 COMANDO TODO EN UNO (Recomendado)

Ejecuta esto para hacer build, deploy y push en un solo comando:

```bash
npm run build && firebase deploy --only hosting && git add . && git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M')" && git push
```

---

## ⚠️ VERIFICACIONES PRE-DEPLOY

### 1. Verificar que `firebase.json` existe:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 2. Verificar que `.firebaserc` existe:
```json
{
  "projects": {
    "default": "cogntech-2fca1"
  }
}
```

### 3. Verificar `package.json` tiene script de build:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

---

## 📝 .gitignore Recomendado

Verifica que `.gitignore` incluye:

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.production

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 🎯 DESPUÉS DEL DEPLOY

### URLs Importantes:

**🌐 App desplegada:**
```
https://cogntech-2fca1.web.app
```

**🔥 Firebase Console:**
```
https://console.firebase.google.com/project/cogntech-2fca1
```

**📊 Firestore Database:**
```
https://console.firebase.google.com/project/cogntech-2fca1/firestore
```

**🐙 GitHub Repository:**
```
https://github.com/TU-USUARIO/cognimirror
```

---

## ✅ CHECKLIST FINAL

- [ ] Build completado sin errores
- [ ] Firebase Hosting deploy exitoso
- [ ] Git commit realizado
- [ ] Push a GitHub exitoso
- [ ] App accesible en URL de producción
- [ ] Firestore Rules actualizadas
- [ ] Datos de prueba visibles en dashboard

---

## 🆘 TROUBLESHOOTING

### Error: "Firebase command not found"
```bash
npm install -g firebase-tools
firebase login
```

### Error: "Build failed"
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules
npm install
npm run build
```

### Error: "Permission denied" en Git
```bash
# Verificar autenticación
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Error: "Deploy failed"
```bash
# Re-login a Firebase
firebase logout
firebase login
firebase use cogntech-2fca1
firebase deploy --only hosting
```

---

## 📦 ARCHIVOS IMPORTANTES DEL PROYECTO

```
Cognimirror-main/
├── src/
│   ├── components/
│   │   ├── mirrors/
│   │   │   ├── MemoryMirror.tsx ✅
│   │   │   ├── DigitSpanMirror.tsx ✅
│   │   │   └── TetrisMirror.tsx ✅
│   │   └── analysis/
│   │       └── AnalysisHistoryViewer.tsx ✅
│   ├── pages/
│   │   └── ObserverDashboard.tsx ✅
│   ├── context/
│   │   └── AnalysisHistoryContext.tsx ✅
│   ├── data/
│   │   └── firebase.ts ✅
│   └── types/
│       └── index.ts ✅
├── firebase.json ✅
├── .firebaserc ✅
├── package.json ✅
└── vite.config.ts ✅
```

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Tu aplicación incluye:
- ✅ Memory Mirror con análisis completo
- ✅ Digit Span Mirror (sensor verbal)
- ✅ Observer Dashboard
- ✅ 8 métricas cognitivas
- ✅ Persistencia Firebase
- ✅ Historial completo
- ✅ Auto-corrección implementada
