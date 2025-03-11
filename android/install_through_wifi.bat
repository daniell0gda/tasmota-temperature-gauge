adb connect 192.168.138.7:5555
adb kill-server && adb tcpip 5555
adb shell am force-stop com.tasmota.temperature.app

@REM install
cd app\build\outputs\apk\debug
adb install -r "tasmota.temperature.app.apk"

@REM reopen app
adb shell monkey -p com.tasmota.temperature.app -c android.intent.category.LAUNCHER 1
