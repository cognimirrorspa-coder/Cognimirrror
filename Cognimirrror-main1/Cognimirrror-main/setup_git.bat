@echo off
echo 🚀 Instalando Git...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile '%TEMP%\git-installer.exe'"
"%TEMP%\git-installer.exe" /VERYSILENT /NORESTART
echo ✅ Git instalado
echo.
echo 📁 Inicializando repositorio...
cd /d c:\Users\gisel\Downloads\Cognimirror-main
git init
git config --global user.name "AlvaFM"
git config --global user.email "alva@example.com"
git branch -M main
echo ✅ Repositorio listo
echo.
echo 📦 Agregando archivos...
git add .
echo ✅ Archivos agregados
echo.
echo 💾 Creando commit...
git commit -m "Sistema completo optimizado - Digit Span, Observer Dashboard, layout compacto"
echo ✅ Commit creado
echo.
echo 🔗 Conectando con GitHub...
git remote add origin https://github.com/AlvaFM/Cognimirror
echo ✅ Conectado
echo.
echo 📤 Subiendo a GitHub...
git push -u origin main
echo ✅ ¡Listo!
pause
