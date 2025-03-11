
## when tasmota has wrong wifi

To reset wifi device turn if off for 30 sec and then turn again in 2-5 sec again turn off, do that few times it will reset iself and turn on network with a prefix "tasmota". Connect to this network and configure new wifi.


After reseting wifi remember to put * into CORS DOMAIN field.


## Steps to Install APK via Wi-Fi

short: go to android/install_through_wifi

Enable Wireless Debugging:

Connect your device to your computer via USB.

Open a command prompt or terminal window in the platform-tools directory of your Android SDK.

Type adb tcpip 5555 to enable wireless debugging.

Find Device IP Address:

Use adb shell ipconfig or adb shell netcfg to find your device's IP address.

Connect to Device Wirelessly:

Type adb connect <device_ip_address>:5555 to connect to your device wirelessly.
e.g. adb connect 192.168.5.29:5555

Install APK:

Once connected, you can install an APK file using the command:

bash
adb shell am force-stop com.tasmota.temperature.app

adb install -r /path/to/your/app.apk
Replace /path/to/your/app.apk with the actual path to your APK file.
e.g. adb install -r "X:\projekty\tray sonoff temp\android\app\build\outputs\apk\debug\tasmota.temperature.app-1.6.apk"

adb shell monkey -p com.tasmota.temperature.app -c android.intent.category.LAUNCHER 1

Verify Installation:

After executing the command, wait for the "Success" message to confirm the installation.