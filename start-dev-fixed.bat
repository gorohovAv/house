@echo off
echo Запуск серверов разработки...

:: Переход в корневую директорию проекта
cd /d %~dp0

:: Включение CGO для работы с SQLite
set CGO_ENABLED=1

:: Очистка кэша Go модулей
echo Очистка кэша Go...
go clean -cache
go mod download

:: Запуск Go сервера в отдельном окне
start cmd /k "echo Запуск Go сервера на порту 8080... && set CGO_ENABLED=1 && go run ."

:: Небольшая задержка перед запуском фронтенда
timeout /t 2 /nobreak >nul

:: Переход в директорию React-приложения и запуск dev-сервера
cd house-app
start cmd /k "echo Запуск React-приложения на порту 3000... && npm run dev"

echo Серверы запущены!
echo Go сервер: http://localhost:8080
echo React приложение: http://localhost:3000
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
