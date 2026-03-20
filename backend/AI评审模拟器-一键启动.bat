@echo off
setlocal enabledelayedexpansion

:: 设置控制台编码
chcp 65001 > nul

:: 检查是否在项目根目录
if not exist "backend\package.json" (
    echo ========================================
    echo 错误：请在AI需求评审模拟器项目根目录运行此脚本！
    echo 当前目录：%CD%
    echo ========================================
    pause
    exit /b 1
)

:: 检查Node.js
where node > nul 2>&1
if %errorlevel% neq 0 (
    echo ========================================
    echo 错误：未检测到Node.js！
    echo 请先安装Node.js：https://nodejs.org/
    echo ========================================
    pause
    exit /b 1
)

:: 主界面
echo.
echo ========================================
echo     AI需求评审模拟器 一键启动工具
echo ========================================
echo.
echo 正在启动服务，请稍候...
echo.

:: 启动后端服务
echo [1/3] 启动后端服务...
cd backend
if not exist "node_modules" (
    echo    检测到首次运行，正在安装后端依赖...
    call npm install
    if !errorlevel! neq 0 (
        echo    错误：后端依赖安装失败！
        pause
        exit /b 1
    )
)
echo    正在启动后端服务（端口3001）...
start "AI评审-后端服务" cmd /k "title AI评审后端 - 端口3001 ^& npm run dev"
cd ..
echo.

:: 等待后端初始化
echo [2/3] 等待后端服务初始化...
timeout /t 5 /nobreak > nul

:: 启动前端服务
echo [3/3] 启动前端服务...
cd feature-review-simulator
if not exist "node_modules" (
    echo    检测到首次运行，正在安装前端依赖...
    call npm install
    if !errorlevel! neq 0 (
        echo    错误：前端依赖安装失败！
        pause
        exit /b 1
    )
)
echo    正在启动前端服务（端口5173）...
start "AI评审-前端服务" cmd /k "title AI评审前端 - 端口5173 ^& npm run dev"
cd ..
echo.

:: 等待前端启动
echo 等待前端服务就绪...
timeout /t 8 /nobreak > nul

:: 检查服务状态并打开浏览器
echo.
echo 正在检查服务状态...
echo.

:: 尝试访问前端服务
curl -s -o nul -w "%%{http_code}" http://localhost:5173 > temp_status.txt 2>nul
set /p STATUS=<temp_status.txt
del temp_status.txt > nul 2>&1

if "%STATUS%"=="200" (
    echo [✓] 服务启动成功！
    echo.
    echo 正在打开浏览器...
    start http://localhost:5173
    echo.
    echo ========================================
    echo     启动完成！
    echo ========================================
    echo.
    echo 应用地址：http://localhost:5173
    echo.
    echo 提示：
    echo - 如果浏览器未自动打开，请手动访问上述地址
    echo - 弹出的命令窗口是服务进程，请勿关闭
    echo - 使用完成后关闭所有弹出的命令窗口即可停止服务
    echo.
) else (
    echo [!] 服务可能尚未完全就绪
    echo.
    echo 请手动访问：http://localhost:5173
    echo 如果无法访问，请检查弹出的命令窗口中的错误信息
    echo.
)

pause
exit /b 0