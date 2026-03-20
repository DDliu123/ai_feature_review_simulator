# 会议白板助手 - 一键启动脚本 (PowerShell版本)
# 使用方法：
# 1. 右键点击此文件，选择"使用 PowerShell 运行"
# 2. 脚本会自动检测端口并处理冲突
# 3. 同时启动前端和后端服务
# 4. 服务启动完成后自动打开浏览器
# 5. 按 Ctrl+C 可停止所有服务
#
# 注意事项：
# - 确保已安装 Node.js 和 npm
# - 首次运行可能需要较长时间安装依赖
# - 如果遇到执行策略问题，请以管理员身份运行：
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 设置编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 函数：检查端口是否被占用
function Test-Port {
    param($Port)
    $tcpConnection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $tcpConnection
}

# 函数：获取可用端口
function Get-AvailablePort {
    param($StartPort)
    $port = $StartPort
    while (Test-Port -Port $port) {
        Write-Host "  端口 $port 被占用，尝试下一个..." -ForegroundColor Yellow
        $port++
    }
    return $port
}

# 函数：检查服务是否就绪
function Test-Service {
    param($Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# 函数：启动服务
function Start-Service {
    param($Name, $Path, $Command, $Port)
    Write-Host "`n正在启动 $Name..." -ForegroundColor Cyan

    # 检查依赖
    if (-not (Test-Path "$Path\node_modules")) {
        Write-Host "  [i] 检测到首次运行，正在安装 $Name 依赖..." -ForegroundColor Yellow
        Set-Location $Path
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [✗] $Name 依赖安装失败" -ForegroundColor Red
            return $false
        }
        Set-Location $PSScriptRoot
    }

    # 启动服务
    $process = Start-Process -FilePath "cmd" -ArgumentList "/k", "cd /d $Path && $Command" -PassThru -WindowStyle Normal
    Write-Host "  [✓] $Name 已启动 (PID: $($process.Id))" -ForegroundColor Green

    return $process
}

# 主程序
Clear-Host
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "          会议白板助手启动程序" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# 保存当前位置
$originalLocation = Get-Location
Set-Location $PSScriptRoot

# 设置服务端口
$backendPort = 3001
$frontendPort = 5173

# 检测端口
Write-Host "正在检测端口状态..." -ForegroundColor Cyan
Write-Host ""

$backendPort = Get-AvailablePort -StartPort $backendPort
Write-Host "  [✓] 后端端口：$backendPort" -ForegroundColor Green

$frontendPort = Get-AvailablePort -StartPort $frontendPort
Write-Host "  [✓] 前端端口：$frontendPort" -ForegroundColor Green
Write-Host ""

# 启动后端服务
$backendProcess = Start-Service -Name "后端服务" -Path "backend" -Command "npm run dev" -Port $backendPort
if (-not $backendProcess) {
    Read-Host "按回车键退出"
    exit 1
}

# 等待后端初始化
Write-Host "`n等待后端服务初始化..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# 启动前端服务
$frontendProcess = Start-Service -Name "前端服务" -Path "feature-review-simulator" -Command "npm run dev -- --port $frontendPort" -Port $frontendPort
if (-not $frontendProcess) {
    Write-Host "`n正在关闭后端服务..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force
    Read-Host "按回车键退出"
    exit 1
}

# 等待前端初始化
Write-Host "`n等待前端服务初始化..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# 检查服务状态
Write-Host "`n正在检查服务状态..." -ForegroundColor Cyan
$servicesReady = $false
$attempts = 0

while (-not $servicesReady -and $attempts -lt 15) {
    $attempts++
    Write-Host "  检查第 $attempts 次..." -ForegroundColor Gray

    # 检查后端
    if (Test-Service -Url "http://localhost:$backendPort/health") {
        Write-Host "    [✓] 后端服务已就绪" -ForegroundColor Green
        $backendReady = $true
    } else {
        Write-Host "    [-] 后端服务未就绪" -ForegroundColor Gray
    }

    # 检查前端
    if (Test-Service -Url "http://localhost:$frontendPort") {
        Write-Host "    [✓] 前端服务已就绪" -ForegroundColor Green
        $frontendReady = $true
    } else {
        Write-Host "    [-] 前端服务未就绪" -ForegroundColor Gray
    }

    if ($backendReady -and $frontendReady) {
        $servicesReady = $true
    } else {
        Start-Sleep -Seconds 2
    }
}

if (-not $servicesReady) {
    Write-Host "`n[!] 服务启动超时，请检查错误信息" -ForegroundColor Red
    Write-Host "正在关闭服务..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Read-Host "按回车键退出"
    exit 1
}

# 服务启动成功
Write-Host "`n============================================" -ForegroundColor Magenta
Write-Host "          服务启动成功！" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "后端服务地址：" -NoNewline
Write-Host "http://localhost:$backendPort" -ForegroundColor Blue
Write-Host "前端服务地址：" -NoNewline
Write-Host "http://localhost:$frontendPort" -ForegroundColor Blue
Write-Host ""
Write-Host "正在打开浏览器..." -ForegroundColor Cyan

# 打开浏览器
Start-Process "http://localhost:$frontendPort"

Write-Host "`n[i] 服务已启动，可以开始使用会议白板助手了" -ForegroundColor Yellow
Write-Host "[i] 按 Ctrl+C 可关闭所有服务并退出" -ForegroundColor Yellow
Write-Host ""

# 等待用户关闭
try {
    Write-Host "服务运行中..." -ForegroundColor Green
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "`n正在关闭所有服务..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue

    # 确保清理所有 Node 进程
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Host "[✓] 所有服务已关闭" -ForegroundColor Green
    Write-Host "`n感谢使用会议白板助手！" -ForegroundColor Magenta
    Start-Sleep -Seconds 2
}
finally {
    Set-Location $originalLocation
}