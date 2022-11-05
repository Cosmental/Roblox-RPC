@ECHO off
ECHO.

:: We need this for our ECHO colorization!
SETLOCAL EnableDelayedExpansion
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

:: This is our initialization setup
TITLE Roblox RPC Setup
ECHO Welcome to the Roblox RPC Setup Wizard!
ECHO.

:: We want to prompt users with the option of enabling Roblox RPC for Roblox Studio!
:promptStudioOption
SET /p enableStudioPresence=Would you like to enable Roblox RPC for Roblox Studio? [ Y / N ]: 
IF '%enableStudioPresence%'=='Y' GOTO promptCOOKIE
IF '%enableStudioPresence%'=='N' GOTO promptCOOKIE

call :setColor 04 "The provided response was invalid. [ Choose either 'Y' or 'N' ]"
ECHO.
GOTO promptStudioOption

:: Now we want to prompt users for their ROBLOSecurity tokens!
:promptCOOKIE
ECHO.
call :setColor 06 "[ WARNING ] Your ROBLOSecurity cookie will ONLY be used to call Roblox API endpoints"
ECHO.
SET /p ROBLOSecurityCookie=Please Input your ROBLOSECURITY Cookie: 

:: Now lets collect our client's Application Outh2 Application ID!
ECHO.
call :setColor 03 "[ INFO ] Your Application ID is used in order to comply with DiscordRPC API requirements"
ECHO.
call :setColor 03 "[ INFO ] Please follow the website prompted by your browser for guidance on getting your OAuth2 discord application ID"
START "" https://support-dev.discord.com/hc/en-us/articles/360028717192-Where-can-I-find-my-Application-Team-Server-ID-#:~:text=The%20Application%20ID%2C%20also%20known,the%20game%20in%20your%20Library.
ECHO.

:promptOAuth2
ECHO.
SET /p OAuth2_APP_ID=Please input your Application OAuth2 ID: 

SET "var="&for /f "delims=0123456789" %%i in ("%OAuth2_APP_ID%") do set var=%%i
if defined var (
    ECHO.
    call :setColor 04 "The provided response was not a valid OAuth2 Discord Developer ID. [ IDs are strictly given in numbers ]"
    ECHO.

    GOTO promptOAuth2
) else (
    ECHO.
    call :setColor 03 "[ HINT ] Your Roblox UserId is located within your profile URL"
    GOTO :promptUserId
)

:: Collect the user's Roblox UserId
:promptUserId
ECHO.
SET /p userId=Please input your Roblox UserID: 

SET "var="&for /f "delims=0123456789" %%i in ("%userId%") do set var=%%i
if defined var (
    ECHO.
    call :setColor 04 "The provided response was not a Roblox UserId! [ Roblox UserIds only come as numbers ]"
    ECHO.

    GOTO promptUserId
)

:: JSON Configuration
setlocal EnableDelayedExpansion

:: SETTINGS

: StudioPresence? < bool >
title <nul & title set variable line_1

if '%enableStudioPresence%' == 'Y' (
  set "_line_1="StudioPresenceEnabled": true"
) else (
  set "_line_1="StudioPresenceEnabled": false"
)

:: TOKENS

: ROBLOSECURITY < string >
title <nul & title set variable line_2
set "_line_2="ROBLOSECURITY": "%ROBLOSecurityCookie%""

: APP_CLIENT_ID < number >

title <nul & title set variable line_3
set "_line_3="AppClientID": %OAuth2_APP_ID%"

: UserID < number >
title <nul & title set variable line_4
set "_line_4="UserId": %userId%"

:: Convert inputs to JSON for our javascript application
title <nul & title write line 1-4 to file: .\configuration.json
>.\configuration.json (
    for /L %%L in (1 1 4)do for /f usebackq^delims^= %%i in (`
            "echo\    !_line_%%~L!"`) do if %%~L equ 1 (
             echo\^{ && echo\%%~i,) else if %%~L neq 4 (
             echo\%%~i,) else echo\%%~i&& echo\^}
            )

:: Checking lines_1-9 :: Checking file contents/lines on screen
title <nul & title Checking file contents/lines on screen
ECHO.
call :setColor 02 "Roblox RPC has successfully been setup! [ vv See configurations below vv ]"
ECHO.
ECHO.
type .\configuration.json
ECHO.
ECHO If you need to update your configurations you can always rerun the setup wizard again
PAUSE
EXIT

:: This serves as a coloring function
:setColor
ECHO off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :eof