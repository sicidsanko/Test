package com.pdftoolspro.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DocumentScannerPlugin.class);
        registerPlugin(PrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
