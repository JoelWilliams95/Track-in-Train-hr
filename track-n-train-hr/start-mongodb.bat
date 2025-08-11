@echo off
echo Starting MongoDB...

REM Create data directory if it doesn't exist
if not exist "C:\mongodb\data\db" mkdir "C:\mongodb\data\db"
if not exist "C:\mongodb\logs" mkdir "C:\mongodb\logs"

REM Start MongoDB
"C:\mongodb\bin\mongod.exe" --dbpath "C:\mongodb\data\db" --logpath "C:\mongodb\logs\mongodb.log" --port 27017

pause
