# Script para inicializar repositorio Git y push a GitHub
# Ejecutar después de instalar Git

Write-Host "Inicializando repositorio..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\gisel\Downloads\Cognimirror-main"

# Verificar si ya es un repositorio
if (!(Test-Path ".git")) {
    Write-Host "Inicializando nuevo repositorio..." -ForegroundColor Yellow
    git init
    git branch -M main
}

# Agregar archivos
Write-Host "Agregando archivos..." -ForegroundColor Yellow
git add .

# Hacer commit
Write-Host "Haciendo commit..." -ForegroundColor Yellow
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

# Agregar remote (reemplaza con tu URL de GitHub)
Write-Host "Agregando remote de GitHub..." -ForegroundColor Yellow
Write-Host "IMPORTANTE: Reemplaza la URL con tu repositorio de GitHub" -ForegroundColor Red
git remote add origin https://github.com/TU-USUARIO/cognimirror.git

# Push
Write-Host "Haciendo push..." -ForegroundColor Yellow
git push -u origin main

Write-Host "¡Repositorio subido a GitHub exitosamente!" -ForegroundColor Green
