@echo off
echo ============================================
echo           会议白板助手 - 简化版
echo ============================================
echo.

:: 确保在项目根目录
cd /d "%~dp0"

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Node.js未安装！
    echo 请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)

:: 启动后端
echo 正在启动后端服务...
cd backend
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
)
echo 启动后端...
start cmd /k "npm run dev"
cd ..

:: 等待一下
timeout /t 3 /nobreak > nul

:: 启动前端
echo 正在启动前端服务...
cd feature-review-simulator
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
)
echo 启动前端...
start cmd /k "npm run dev"
cd ..

:: 等待服务启动
echo.
echo 等待服务启动...
timeout /t 5 /nobreak > nul

:: 打开浏览器
echo 正在打开浏览器...
start http://localhost:5173

echo.
echo [✓] 服务已启动！
echo [i] 浏览器应该会自动打开应用
pause