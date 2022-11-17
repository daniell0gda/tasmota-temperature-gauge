package com.tasmota.temperature.app;

import android.os.Bundle;

import com.capacitorjs.plugins.app.AppPlugin;
import com.capacitorjs.plugins.toast.ToastPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    registerPlugin(AppPlugin.class);
    registerPlugin(ToastPlugin.class);
  }
}
