@echo off
chcp 65001 > nul
:: 会议白板助手 - 一键启动脚本
:: 使用方法：
:: 1. 直接双击运行此脚本
:: 2. 脚本会自动检测端口并处理冲突
:: 3. 同时启动前端和后端服务
:: 4. 服务启动完成后自动打开浏览器
:: 5. 按 Ctrl+C 可停止所有服务
::
:: 注意事项：
:: - 确保已安装 Node.js 和 npm
:: - 首次运行可能需要较长时间安装依赖

title 会议白板助手 - 启动中...

echo ============================================
echo           会议白板助手启动程序
echo ============================================
echo.

:: 保存当前目录
cd /d "%~dp0"

:: 设置服务端口
set BACKEND_PORT=3001
set FRONTEND_PORT=5173

:: 检查端口是否被占用
echo 正在检测端口状态...
echo.

:: 检查后端端口
netstat -ano | findstr ":%BACKEND_PORT%" > nul
if %errorlevel% equ 0 (
    echo [!] 后端端口 %BACKEND_PORT% 已被占用，正在查找可用端口...
    set BACKEND_PORT=3002
    netstat -ano | findstr ":%BACKEND_PORT%" > nul
    if %errorlevel% equ 0 (
        set BACKEND_PORT=3003
    )
)
echo [✓] 后端端口：%BACKEND_PORT%

:: 检查前端端口
netstat -ano | findstr ":%FRONTEND_PORT%" > nul
if %errorlevel% equ 0 (
    echo [!] 前端端口 %FRONTEND_PORT% 已被占用，正在查找可用端口...
    set FRONTEND_PORT=5174
    netstat -ano | findstr ":%FRONTEND_PORT%" > nul
    if %errorlevel% equ 0 (
        set FRONTEND_PORT=5175
    )
)
echo [✓] 前端端口：%FRONTEND_PORT%
echo.

:: 启动后端服务
echo 正在启动后端服务...
cd backend

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo [i] 检测到首次运行，正在安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [✗] 后端依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

:: 启动后端服务
start "后端服务 - 端口 %BACKEND_PORT%" cmd /k "npm run dev"
cd ..
echo [✓] 后端服务已启动
echo.

:: 等待后端服务启动
echo 等待后端服务初始化...
timeout /t 5 /nobreak > nul

:: 启动前端服务
echo 正在启动前端服务...
cd feature-review-simulator

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo [i] 检测到首次运行，正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [✗] 前端依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
)

:: 启动前端服务
start "前端服务 - 端口 %FRONTEND_PORT%" cmd /k "npm run dev -- --port %FRONTEND_PORT%"
cd ..
echo [✓] 前端服务已启动
echo.

:: 等待前端服务启动
echo 等待前端服务初始化...
timeout /t 8 /nobreak > nul

:: 检查服务是否成功启动
echo 正在检查服务状态...
set SERVICES_READY=0
set ATTEMPTS=0

:CHECK_SERVICES
set /a ATTEMPTS+=1
echo   检查第 %ATTEMPTS% 次...

:: 检查后端服务
curl -s -o nul -w "%%{http_code}" http://localhost:%BACKEND_PORT%/health > backend_status.txt 2>nul
set /p BACKEND_STATUS=<backend_status.txt
if "%BACKEND_STATUS%"=="200" (
    echo   [✓] 后端服务已就绪
) else (
    echo   [-] 后端服务未就绪
)

:: 检查前端服务
curl -s -o nul -w "%%{http_code}" http://localhost:%FRONTEND_PORT% > frontend_status.txt 2>nul
set /p FRONTEND_STATUS=<frontend_status.txt
if "%FRONTEND_STATUS%"=="200" (
    echo   [✓] 前端服务已就绪
) else (
    echo   [-] 前端服务未就绪
)

:: 判断是否都准备好了
if "%BACKEND_STATUS%"=="200" (
    set SERVICES_READY=1
    goto :SERVICES_OK
)

if %ATTEMPTS% geq 10 (
    echo.
    echo [!] 服务启动超时，请检查错误信息
    pause
    exit /b 1
)

timeout /t 2 /nobreak > nul
goto :CHECK_SERVICES

:SERVICES_OK
echo.
echo ============================================
echo           服务启动成功！
echo ============================================
echo.
echo 后端服务地址：http://localhost:%BACKEND_PORT%
echo 前端服务地址：http://localhost:%FRONTEND_PORT%
echo.
echo 正在打开浏览器...

:: 打开默认浏览器
start http://localhost:%FRONTEND_PORT%

title 会议白板助手 - 运行中

echo.
echo [i] 服务已启动，可以开始使用会议白板助手了
echo [i] 按任意键可关闭所有服务并退出
echo.

pause

:: 关闭所有服务
echo.
echo 正在关闭所有服务...
taskkill /F /FI "WindowTitle eq 后端服务 - 端口 *" > nul 2>&1
taskkill /F /FI "WindowTitle eq 前端服务 - 端口 *" > nul 2>&1
taskkill /F /IM node.exe > nul 2>&1

:: 清理临时文件
del backend_status.txt frontend_status.txt > nul 2>&1

echo [✓] 所有服务已关闭
echo.
echo 感谢使用会议白板助手！
timeout /t 3 /nobreak > nul

exit /b 0