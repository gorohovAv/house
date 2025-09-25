@echo off
echo ========================================
echo    Запуск HouseApp - Go + React
echo ========================================
echo.

:: Переход в корневую директорию проекта
cd /d %~dp0

:: Установка переменных окружения для PostgreSQL
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=12345
set DB_NAME=houseapp

echo [1/3] Запуск Go сервера на порту 8080...
start cmd /k "echo Go сервер: http://localhost:8080 && go run ."

echo [2/3] Запуск React приложения на порту 3000...
cd house-app
start cmd /k "echo React приложение: http://localhost:3000 && npm run dev"

echo.
echo ========================================
echo    Сервисы запущены!
echo ========================================
echo Go сервер:  http://localhost:8080
echo React:      http://localhost:3000
echo.
echo Убедитесь, что PostgreSQL запущен локально!
echo.
echo Нажмите любую клавишу для выхода...
pause >nul 