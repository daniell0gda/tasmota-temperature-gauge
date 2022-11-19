rem adb kill-server
rem adb tcpip 5555
rem gradle:restart

adb connect 192.168.5.10:5555

adb -s 192.168.5.10:5555 install -r android/app/build/outputs/apk/debug/app-debug.apk

rem adb -s 192.168.5.10:5555 install -r android/app/release/app-release.apk
