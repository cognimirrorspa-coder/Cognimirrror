# deploy.ps1 - Script de Deploy Automático para CogniMirror
# Ejecutar con: .\deploy.ps1

Write-Host "🚀 ================================" -ForegroundColor Cyan
Write-Host "🚀 COGNIMIRROR - DEPLOY AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "🚀 ================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Build
Write-Host "📦 PASO 1: Construyendo aplicación..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build. Abortando deploy." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completado exitosamente!" -ForegroundColor Green
Write-Host ""

# Paso 2: Firebase Deploy
Write-Host "☁️  PASO 2: Desplegando a Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el deploy de Firebase. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deploy a Firebase exitoso!" -ForegroundColor Green
Write-Host ""

# Paso 3: Git Add
Write-Host "📝 PASO 3: Preparando commit..." -ForegroundColor Yellow
git add .

# Paso 4: Git Commit
$fecha = Get-Date -Format "yyyy-MM-dd HH:mm"
$mensaje = "🚀 Deploy: $fecha - Sistema de análisis cognitivo completo"

Write-Host "💾 Creando commit: $mensaje" -ForegroundColor Yellow
git commit -m "$mensaje"

# Paso 5: Git Push
Write-Host "📤 PASO 4: Subiendo cambios a GitHub..." -ForegroundColor Yellow
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Error en git push. Verifica tu conexión." -ForegroundColor Yellow
} else {
    Write-Host "✅ Push a GitHub exitoso!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 ================================" -ForegroundColor Green
Write-Host "🎉 DEPLOY COMPLETADO" -ForegroundColor Green
Write-Host "🎉 ================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 URLs Importantes:" -ForegroundColor Cyan
Write-Host "   🌐 App: https://cogntech-2fca1.web.app" -ForegroundColor White
Write-Host "   🔥 Firebase: https://console.firebase.google.com/project/cogntech-2fca1" -ForegroundColor White
Write-Host ""
