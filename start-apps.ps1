# Start Xalon Apps with LAN configuration
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("xalon", "xalonhub")]
    $App
)

$ip = (ipconfig | findstr "IPv4" | findstr "192.168").Split(":")[1].Trim()
Write-Host "Detected LAN IP: $ip" -ForegroundColor Cyan

if ($App -eq "xalon") {
    cd apps/xalon
    npx expo start --host lan
} elseif ($App -eq "xalonhub") {
    cd apps/xalonhub
    npx expo start --host lan
}
