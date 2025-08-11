@echo off
echo Testing API Endpoints...
echo ==========================================

echo.
echo TEST 1: Testing Personnel Records API
echo ------------------------------------------
curl -X GET "http://localhost:3000/api/personnel-records" -H "Content-Type: application/json"

echo.
echo.
echo TEST 2: Testing Comments API (GET)
echo ------------------------------------------
curl -X GET "http://localhost:3000/api/comments?fullName=hihcam" -H "Content-Type: application/json"

echo.
echo.
echo TEST 3: Testing Notifications API
echo ------------------------------------------
curl -X GET "http://localhost:3000/api/notifications/get?userId=SuperAdmin" -H "Content-Type: application/json"

echo.
echo.
echo API Tests Completed!
echo ==========================================
pause
