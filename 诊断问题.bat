@echo off
echo ============================================
echo           诊断脚本 - 检查常见问题
echo ============================================
echo.

:: 检查当前目录
echo [1] 检查当前目录:
echo    当前目录: %CD%
echo.

:: 检查Node.js
echo [2] 检查Node.js安装:
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo    [✓] Node.js已安装
    node -v
) else (
    echo    [✗] Node.js未安装或未配置环境变量
    echo    请访问 https://nodejs.org/ 下载安装
)
echo.

:: 检查npm
echo [3] 检查npm安装:
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo    [✓] npm已安装
    npm -v
) else (
    echo    [✗] npm未安装或未配置环境变量
)
echo.

:: 检查项目结构
echo [4] 检查项目结构:
if exist "backend" (
    echo    [✓] backend目录存在
) else (
    echo    [✗] backend目录不存在
)

if exist "feature-review-simulator" (
    echo    [✓] feature-review-simulator目录存在
) else (
    echo    [✗] feature-review-simulator目录不存在
)
echo.

:: 检查端口占用
echo [5] 检查端口占用:
echo    检查端口3001:
netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo    [!] 端口3001被占用
) else (
    echo    [✓] 端口3001可用
)

echo    检查端口5173:
netstat -ano | findstr ":5173" >nul
if %errorlevel% equ 0 (
    echo    [!] 端口5173被占用
) else (
    echo    [✓] 端口5173可用
)
echo.

:: 检查后端依赖
echo [6] 检查后端依赖:
if exist "backend\package.json" (
    echo    [✓] backend/package.json存在
    if exist "backend\node_modules" (
        echo    [✓] 后端依赖已安装
    ) else (
        echo    [!] 后端依赖未安装
    )
) else (
    echo    [✗] backend/package.json不存在
)
echo.

:: 检查前端依赖
echo [7] 检查前端依赖:
if exist "feature-review-simulator\package.json" (
    echo    [✓] feature-review-simulator/package.json存在
    if exist "feature-review-simulator\node_modules" (
        echo    [✓] 前端依赖已安装
    ) else (
        echo    [!] 前端依赖未安装
    )
) else (
    echo    [✗] feature-review-simulator/package.json不存在
)
echo.

:: 检查环境变量
echo [8] 检查环境变量:
echo    PATH中包含Node.js:
where node >nul 2>nul && echo    [✓] 是 || echo    [✗] 否
echo.

:: 测试简单命令
echo [9] 测试基本命令:
echo    测试目录切换:
cd backend >nul 2>nul && echo    [✓] 可以切换到backend目录 || echo    [✗] 无法切换到backend目录
cd .. >nul
echo.

:: 提供解决方案
echo ============================================
echo           可能的解决方案
echo ============================================
echo.
echo 如果Node.js未安装:
echo   - 访问 https://nodejs.org/ 下载并安装Node.js
echo.
echo 如果依赖未安装:
echo   - 手动安装后端依赖: cd backend && npm install
echo   - 手动安装前端依赖: cd feature-review-simulator && npm install
echo.
echo 如果端口被占用:
echo   - 关闭占用端口的程序，或
echo   - 修改项目配置文件中的端口
echo.
echo 如果双击无法运行:
echo   - 尝试右键以管理员身份运行
echo   - 检查是否有杀毒软件阻止
echo   - 尝试在命令提示符中手动运行
echo.
echo 其他建议:
echo   - 确保在项目根目录运行脚本
echo   - 检查是否有中文路径问题
echo   - 尝试使用PowerShell版本

pause