# ⚡ QUICK DEPLOY - COGNIMIRROR

## 🚀 DEPLOY AUTOMÁTICO (UN SOLO COMANDO)

### Opción 1: Script PowerShell (Recomendado para Windows)

```powershell
.\deploy.ps1
```

### Opción 2: Comandos Manuales

```bash
# Build + Deploy + Push
npm run build && firebase deploy --only hosting && git add . && git commit -m "Deploy $(date +'%Y-%m-%d %H:%M')" && git push
```

---

## 📦 COMANDOS INDIVIDUALES

### 1. Solo Build
```bash
npm run build
```

### 2. Solo Firebase Deploy
```bash
firebase deploy --only hosting
```

### 3. Solo Git Push
```bash
git add .
git commit -m "Update: Sistema de análisis cognitivo"
git push
```

### 4. Deploy Firestore Rules (Si las actualizaste)
```bash
firebase deploy --only firestore:rules
```

---

## 🌐 URLs DEL PROYECTO

**App en Producción:**
```
https://cogntech-2fca1.web.app
```

**Firebase Console:**
```
https://console.firebase.google.com/project/cogntech-2fca1
```

**Firestore Database:**
```
https://console.firebase.google.com/project/cogntech-2fca1/firestore
```

---

## ✅ CHECKLIST PRE-DEPLOY

- [ ] Código sin errores TypeScript
- [ ] Build exitoso (`npm run build`)
- [ ] Firestore Rules actualizadas
- [ ] Variables de entorno configuradas
- [ ] Git repository configurado
- [ ] Firebase CLI autenticado

---

## 🆘 SOLUCIÓN RÁPIDA DE PROBLEMAS

### Firebase command not found
```bash
npm install -g firebase-tools
firebase login
```

### Build failed
```bash
npm install
npm run build
```

### Git permission denied
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 🎯 LO QUE SE DESPLEGARÁ

✅ **Memory Mirror** - Análisis visual completo  
✅ **Digit Span Mirror** - Sensor verbal  
✅ **Tetris Mirror** - Ready (código en TETRIS_IMPLEMENTATION_GUIDE.md)  
✅ **Observer Dashboard** - Panel para padres  
✅ **8 Métricas Cognitivas** - Sistema completo  
✅ **Firebase Persistence** - Datos sincronizados  
✅ **Historial Completo** - Todas las sesiones  

---

## 🔥 DESPUÉS DEL DEPLOY

1. Verifica que la app carga: https://cogntech-2fca1.web.app
2. Prueba Memory Mirror
3. Revisa que los datos se guardan en Firestore
4. Verifica el Observer Dashboard

¡LISTO! 🎉
