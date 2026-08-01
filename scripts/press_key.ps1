param([string]$key)

# Definir firma de C# para usar la API global de hardware keybd_event de user32.dll
$signature = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);'
$type = Add-Type -MemberDefinition $signature -Name "Keyboard" -Namespace "Win32" -PassThru

if ($key -eq "right") {
    # Virtual-Key 0x27 = Flecha Derecha (ArrowRight)
    $type::keybd_event(0x27, 0, 0, 0) # Key Down
    $type::keybd_event(0x27, 0, 2, 0) # Key Up
} elseif ($key -eq "left") {
    # Virtual-Key 0x25 = Flecha Izquierda (ArrowLeft)
    $type::keybd_event(0x25, 0, 0, 0) # Key Down
    $type::keybd_event(0x25, 0, 2, 0) # Key Up
}
