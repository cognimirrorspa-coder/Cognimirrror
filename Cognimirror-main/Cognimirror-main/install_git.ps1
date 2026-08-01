# Script para instalar Git e inicializar repositorio
# Ejecutar como administrador

Write-Host "Instalando Git..." -ForegroundColor Green

# Descargar Git
Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" -OutFile "$env:TEMP\git-installer.exe" -UseBasicParsing

# Instalar Git
Write-Host "Ejecutando instalador..." -ForegroundColor Yellow
Start-Process "$env:TEMP\git-installer.exe" -ArgumentList "/VERYSILENT /NORESTART /COMPONENTS=""gitlfs""" -Wait

# Esperar a que se complete la instalación
Start-Sleep -Seconds 10

# Verificar instalación
$gitVersion = git --version
Write-Host "Git instalado: $gitVersion" -ForegroundColor Green

# Configurar Git (reemplaza con tus datos)
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@example.com"

Write-Host "Git configurado exitosamente!" -ForegroundColor Green
