@echo off
setlocal

:: ============================================================================
:: AI 需求评审模拟器一键启动脚本
::
:: 使用方法:
:: 1. 直接双击运行此脚本。
:: 2. 脚本会自动检查并关闭占用的端口 (3001 和 5173)。
:: 3. 脚本会自动安装缺失的依赖 (如果 node_modules 不存在)。
:: 4. 脚本会分别启动后端和前端服务。
:: 5. 启动成功后，会自动在默认浏览器中打开应用页面。
::
:: @author Gemini
:: @date 2026-03-21
:: ============================================================================

title AI 需求评审模拟器 - 启动程序

:: 定义端口
set BACKEND_PORT=3001
set FRONTEND_PORT=5173

:: 获取脚本所在目录
set SCRIPT_DIR=%~dp0

echo.
echo [INFO] 正在启动 AI 需求评审模拟器...
echo [INFO] 脚本目录: %SCRIPT_DIR%
echo.

:: --- 检查并处理端口冲突 ---
echo [STEP 1/4] 正在检查端口...
for %%P in (%BACKEND_PORT% %FRONTEND_PORT%) do (
    echo [INFO] 检查端口 %%P...
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P"') do (
        if not "%%A"=="0" (
            echo [WARN] 端口 %%P 被进程 PID %%A 占用。正在尝试关闭...
            taskkill /F /PID %%A > nul
            if !errorlevel! equ 0 (
                echo [SUCCESS] 成功关闭进程 PID %%A。
            ) else (
                echo [ERROR] 关闭进程 PID %%A 失败。请手动关闭。
                exit /b 1
            )
        )
    )
)
echo [SUCCESS] 端口检查完成，无冲突。
echo.

:: --- 启动后端服务 ---
echo [STEP 2/4] 正在启动后端服务...
cd /d "%SCRIPT_DIR%backend"
if not exist node_modules (
    echo [INFO] 后端 node_modules 不存在，正在安装依赖...
    call npm install
)
start "Backend (Port: %BACKEND_PORT%)" cmd /c "npm run dev"
echo [SUCCESS] 后端服务已在新的窗口启动。
echo.

:: --- 启动前端服务 ---
echo [STEP 3/4] 正在启动前端服务...
cd /d "%SCRIPT_DIR%feature-review-simulator"
if not exist node_modules (
    echo [INFO] 前端 node_modules 不存在，正在安装依赖...
    call npm install
)
start "Frontend (Port: %FRONTEND_PORT%)" cmd /c "npm run dev"
echo [SUCCESS] 前端服务已在新的窗口启动。
echo.

:: --- 等待服务就绪并打开浏览器 ---
echo [STEP 4/4] 正在等待服务初始化...
echo [INFO] 等待 15 秒后将自动打开浏览器。
timeout /t 15 /nobreak > nul
echo [INFO] 正在打开浏览器: http://localhost:%FRONTEND_PORT%
start http://localhost:%FRONTEND_PORT%

echo.
echo [COMPLETE] 所有服务均已启动！您可以关闭此窗口。
echo.

endlocal
