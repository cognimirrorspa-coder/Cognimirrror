import asyncio
import sys
from bleak import BleakScanner, BleakClient

# Intentamos importar pyautogui para simular pulsaciones de teclado globales.
# Si el usuario no lo tiene instalado, le damos la instrucción para instalarlo.
try:
    import pyautogui
    # Desactivar el fail-safe de PyAutoGUI para evitar interrupciones accidentales al mover el mouse a las esquinas
    pyautogui.FAILSAFE = False
except ImportError:
    print("\n[ERROR]: Falta instalar la libreria 'pyautogui' para controlar el teclado.")
    print("Por favor, ejecuta el siguiente comando en tu consola antes de iniciar el script:")
    print("-> pip install pyautogui bleak\n")
    sys.exit(1)

# UUIDs de comunicación estándar para cubos inteligentes (Giiker / compatible)
SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

# Mapeo de movimientos del cubo según protocolo
FACE_TABLE = ["F", "F'", "B", "B'", "U", "U'", "D", "D'", "L", "L'", "R", "R'"]

# Cooldown simple para evitar pases accidentales por rebote
last_action_time = 0

def notification_handler(sender, data):
    global last_action_time
    bytes_data = list(data)
    
    # Buscar el byte de inicio '*' (0x2a / 42)
    for i in range(len(bytes_data)):
        if bytes_data[i] == 0x2a:
            type_val = bytes_data[i + 1]
            move_id = -1
            
            if type_val == 6 and len(bytes_data) >= i + 8:
                move_id = bytes_data[i + 3]
            elif type_val == 8 and len(bytes_data) >= i + 10:
                move_id = bytes_data[i + 3]
                
            if 0 <= move_id < len(FACE_TABLE):
                move_name = FACE_TABLE[move_id]
                print(f"[Cubo Detectado] Giro: {move_name}")
                
                # --- CONTROL DE LA PRESENTACIÓN ---
                # Giros en cara Naranja (L o L'): Avanzar
                if move_name in ["L", "L'"]:
                    print("➡️ Simulando tecla: FLECHA DERECHA (Avanzar diapositiva)")
                    pyautogui.press('right')
                    
                # Giros en cara Roja (R o R'): Retroceder
                elif move_name in ["R", "R'"]:
                    print("⬅️ Simulando tecla: FLECHA IZQUIERDA (Retroceder diapositiva)")
                    pyautogui.press('left')
                break

async def main():
    print("=== CONTROLADOR DE PRESENTACION GLOBAL CON CUBO DE RUBIK ===")
    
    cube_device = None
    while not cube_device:
        print("Buscando cubo inteligente por Bluetooth... (Gira una cara del cubo para despertarlo)")
        try:
            devices = await BleakScanner.discover(timeout=3.0)
            for d in devices:
                name = d.name or ""
                # Buscar por nombres comunes de cubos inteligentes
                if "gi" in name.lower() or "cube" in name.lower() or "rubik" in name.lower():
                    cube_device = d
                    break
        except Exception as e:
            print(f"[Error de Escaneo]: {e}. Reintentando en 3 segundos...")
            await asyncio.sleep(3)
            continue
            
        if not cube_device:
            print("[INFO] No se encontro ningun cubo encendido cerca. Reintentando...")
            await asyncio.sleep(2)

    print(f"[OK] Cubo encontrado: {cube_device.name} ({cube_device.address})")
    print("Conectando al dispositivo...")
    
    async with BleakClient(cube_device.address) as client:
        if client.is_connected:
            print("[CONECTADO] ¡Conectado al cubo con éxito!")
            print("\nInstrucciones de uso:")
            print("- Gira la cara NARANJA (L o L') para AVANZAR de diapositiva.")
            print("- Gira la cara ROJA (R o R') para RETROCEDER de diapositiva.")
            print("- Puedes abrir tu PowerPoint, PDF o Google Slides en pantalla completa y controlar todo con tu cubo fisico.")
            print("\nPresiona Ctrl+C en esta terminal para desconectar y salir.")
            
            # 2. Suscribirse a las notificaciones de los giros
            await client.start_notify(CHAR_UUID, notification_handler)
            
            # Mantener el script corriendo
            while True:
                await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nDesconectando cubo y saliendo del script. ¡Mucho exito en tu defensa!")
