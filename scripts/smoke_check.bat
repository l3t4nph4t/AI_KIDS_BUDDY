@echo off
REM AI Kids Buddy - Smoke Check
echo === AI Kids Buddy Smoke Check ===
set pass=0
set fail=0

if exist web\index.html (echo [PASS] web/index.html & set /a pass+=1) else (echo [FAIL] web/index.html & set /a fail+=1)
if exist web\style.css (echo [PASS] web/style.css & set /a pass+=1) else (echo [FAIL] web/style.css & set /a fail+=1)
if exist web\script.js (echo [PASS] web/script.js & set /a pass+=1) else (echo [FAIL] web/script.js & set /a fail+=1)
if exist web\manifest.json (echo [PASS] web/manifest.json & set /a pass+=1) else (echo [FAIL] web/manifest.json & set /a fail+=1)
if exist web\sw.js (echo [PASS] web/sw.js & set /a pass+=1) else (echo [FAIL] web/sw.js & set /a fail+=1)
if exist backend\main.py (echo [PASS] backend/main.py & set /a pass+=1) else (echo [FAIL] backend/main.py & set /a fail+=1)
if exist backend\mimo_client.py (echo [PASS] backend/mimo_client.py & set /a pass+=1) else (echo [FAIL] backend/mimo_client.py & set /a fail+=1)
if exist backend\prompts.py (echo [PASS] backend/prompts.py & set /a pass+=1) else (echo [FAIL] backend/prompts.py & set /a fail+=1)
if exist backend\safety_alpha.py (echo [PASS] backend/safety_alpha.py & set /a pass+=1) else (echo [FAIL] backend/safety_alpha.py & set /a fail+=1)

python -m py_compile backend\main.py && (echo [PASS] backend/main.py compiles & set /a pass+=1) || (echo [FAIL] backend/main.py compiles & set /a fail+=1)
python -m py_compile backend\mimo_client.py && (echo [PASS] backend/mimo_client.py compiles & set /a pass+=1) || (echo [FAIL] backend/mimo_client.py compiles & set /a fail+=1)
python -m py_compile backend\prompts.py && (echo [PASS] backend/prompts.py compiles & set /a pass+=1) || (echo [FAIL] backend/prompts.py compiles & set /a fail+=1)
python -m py_compile backend\safety_alpha.py && (echo [PASS] backend/safety_alpha.py compiles & set /a pass+=1) || (echo [FAIL] backend/safety_alpha.py compiles & set /a fail+=1)

echo.
echo === Results: %pass% passed, %fail% failed ===
if %fail% gtr 0 (exit /b 1) else (exit /b 0)
