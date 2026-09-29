@echo off
title PokeIDLE PiP Launcher
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:5173" --window-size=440,280 --user-data-dir="%TEMP%\pokeidle_profile"
) else (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:5173" --window-size=440,280 --user-data-dir="%TEMP%\pokeidle_profile"
)
