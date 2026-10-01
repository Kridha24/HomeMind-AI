package com.kridha.homemind;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.kridha.homemind.sms.HomeMindSmsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HomeMindSmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
