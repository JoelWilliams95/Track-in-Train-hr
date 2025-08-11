@echo off
echo Starting MongoDB manually...

REM Create data directory if it doesn't exist
if not exist "C:\data\db" mkdir "C:\data\db"

REM Try different MongoDB installation paths
set MONGO_PATH=""

if exist "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" (
    set MONGO_PATH="C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
    set MONGO_PATH="C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
    set MONGO_PATH="C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
) else if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" (
    set MONGO_PATH="C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"
) else (
    echo MongoDB not found in standard locations
    echo Please check your MongoDB installation
    pause
    exit /b 1
)

echo Found MongoDB at: %MONGO_PATH%
echo Starting MongoDB on port 27017...
echo Data directory: C:\data\db
echo.
echo Keep this window open while using the application
echo Press Ctrl+C to stop MongoDB
echo.

REM Start MongoDB
%MONGO_PATH% --dbpath "C:\data\db" --port 27017

pause
