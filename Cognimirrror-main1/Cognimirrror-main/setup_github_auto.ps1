# Script automático para subir a GitHub
# Ejecuta este script después de que Git esté instalado

Write-Host "🚀 Iniciando proceso de Git..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\gisel\Downloads\Cognimirror-main"

# Verificar que Git esté instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git no está instalado. Instalando Git..." -ForegroundColor Yellow
    
    # Descargar e instalar Git
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" -OutFile "$env:TEMP\git-installer.exe" -UseBasicParsing
    Start-Process "$env:TEMP\git-installer.exe" -ArgumentList "/VERYSILENT /NORESTART /COMPONENTS=""gitlfs""" -Wait
    
    # Verificar instalación
    try {
        $gitVersion = git --version
        Write-Host "✅ Git instalado: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error instalando Git. Descárgalo manualmente desde https://git-scm.com/download/win" -ForegroundColor Red
        exit
    }
}

# Configurar Git si no está configurado
$name = git config --global user.name
$email = git config --global user.email

if (-not $name -or -not $email) {
    Write-Host "⚙️ Configurando Git..." -ForegroundColor Yellow
    git config --global user.name "AlvaFM"
    git config --global user.email "alva@example.com"
    Write-Host "✅ Git configurado" -ForegroundColor Green
}

# Inicializar repositorio si no existe
if (!(Test-Path ".git")) {
    Write-Host "📁 Inicializando repositorio..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✅ Repositorio inicializado" -ForegroundColor Green
}

# Agregar archivos
Write-Host "📦 Agregando archivos..." -ForegroundColor Yellow
git add .
Write-Host "✅ Archivos agregados" -ForegroundColor Green

# Hacer commit
Write-Host "💾 Creando commit..." -ForegroundColor Yellow
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
Write-Host "✅ Commit creado" -ForegroundColor Green

# URL del repositorio proporcionada
$githubUrl = "https://github.com/AlvaFM/Cognimirror"

Write-Host "🔗 Conectando con GitHub..." -ForegroundColor Yellow
try {
    git remote add origin $githubUrl
    Write-Host "✅ Remote agregado" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Remote ya existe, actualizando..." -ForegroundColor Yellow
    git remote set-url origin $githubUrl
    Write-Host "✅ Remote actualizado" -ForegroundColor Green
}

Write-Host "📤 Subiendo a GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host "✅ ¡Código subido exitosamente a GitHub!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al subir. Posibles causas:" -ForegroundColor Red
    Write-Host "1. El repositorio podría estar vacío (normal la primera vez)" -ForegroundColor Yellow
    Write-Host "2. Podrías necesitar credenciales de GitHub" -ForegroundColor Yellow
    Write-Host "3. Intenta ejecutar manualmente: git push -u origin main" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor Cyan
Write-Host "🎉 ¡Proceso completado!" -ForegroundColor Green
Write-Host "Revisa tu repositorio en: https://github.com/AlvaFM/Cognimirror" -ForegroundColor White
