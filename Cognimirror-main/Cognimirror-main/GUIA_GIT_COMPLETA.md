# 🚀 GUIA PASO A PASO PARA SUBIR A GITHUB

## PASO 1: Verificar que Git esté instalado
Ejecuta en PowerShell:
```powershell
git --version
```
Deberías ver algo como: `git version 2.43.0.windows.1`

## PASO 2: Configurar Git (solo la primera vez)
```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu-email@example.com"
```

## PASO 3: Inicializar repositorio
```bash
cd c:\Users\gisel\Downloads\Cognimirror-main
git init
git branch -M main
```

## PASO 4: Agregar archivos
```bash
git add .
```

## PASO 5: Hacer commit
```bash
git commit -m "✨ Sistema completo optimizado - Digit Span, Observer Dashboard, layout compacto

- ✅ Digit Span Mirror implementado (al lado de Memory Mirror)
  - Voz española femenina
  - Números visuales gigantes
  - Grid completo (0-9 visible)
  - Animaciones de feedback
  - Teclado numérico funcional

- ✅ Todos los juegos optimizados para pantalla completa
  - Sin scroll incluso con barra de tareas

- ✅ Observer Dashboard con Guía para Padres
  - 4 tarjetas educativas
  - Consejos específicos por juego

- ✅ Tetris optimizado
  - Header compacto
  - Game Over en panel lateral"

```

## PASO 6: Crear repositorio en GitHub
1. Ve a https://github.com
2. Click en "New repository"
3. Nombre: `cognimirror` (o el que prefieras)
4. NO marques "Add a README file"
5. Click "Create repository"

## PASO 7: Conectar con GitHub
**IMPORTANTE:** Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub
```bash
git remote add origin https://github.com/TU-USUARIO/cognimirror.git
```

## PASO 8: Subir a GitHub
```bash
git push -u origin main
```

---

## 🔧 COMANDOS RÁPIDOS PARA FUTURO:

```bash
# Después de hacer cambios
git add .
git commit -m "Descripción del cambio"
git push
```

---

## ⚠️ SI TIENES PROBLEMAS:

### Problema: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/cognimirror.git
```

### Problema: "Permission denied"
Asegúrate de:
1. Tener una cuenta en GitHub
2. Usar tu nombre de usuario correcto en la URL
3. Si usas SSH, configurar las llaves

### Problema: "Repository not found"
Verifica que:
1. El repositorio existe en GitHub
2. La URL es correcta
3. Tienes permisos para escribir en el repositorio

---

## 📋 CHECKLIST FINAL:

- [ ] Git instalado ✓
- [ ] Git configurado con nombre y email
- [ ] Repositorio inicializado
- [ ] Archivos agregados
- [ ] Commit creado
- [ ] Repositorio creado en GitHub
- [ ] Remote agregado
- [ ] Push exitoso

---

¡Una vez que completes estos pasos, tu código estará en GitHub! 🎉
