package com.pdftoolspro.app;

import android.app.Activity;
import android.content.Intent;
import android.content.IntentSender;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.IntentSenderRequest;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanner;
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning;
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "DocumentScanner")
public class DocumentScannerPlugin extends Plugin {

    @PluginMethod
    public void scanDocument(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity is null");
            return;
        }

        try {
            int pageLimit = call.getInt("pageLimit", 20);
            boolean isGalleryImport = call.getBoolean("galleryImport", true);

            GmsDocumentScannerOptions options = new GmsDocumentScannerOptions.Builder()
                .setGalleryImportAllowed(isGalleryImport)
                .setPageLimit(pageLimit)
                .setResultFormats(
                    GmsDocumentScannerOptions.RESULT_FORMAT_JPEG,
                    GmsDocumentScannerOptions.RESULT_FORMAT_PDF
                )
                .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
                .build();

            GmsDocumentScanner scanner = GmsDocumentScanning.getClient(options);

            scanner.getStartScanIntent(activity)
                .addOnSuccessListener(intentSender -> {
                    IntentSenderRequest request = new IntentSenderRequest.Builder(intentSender).build();
                    startActivityForResult(call, request, "handleScanResult");
                })
                .addOnFailureListener(e -> {
                    call.reject("Failed to start ML Kit Document Scanner: " + e.getMessage(), e);
                });

        } catch (Exception e) {
            call.reject("Error launching scanner: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleScanResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            GmsDocumentScanningResult scanResult = GmsDocumentScanningResult.fromActivityResultIntent(result.getData());
            if (scanResult == null) {
                call.reject("Scan result is null");
                return;
            }

            JSObject ret = new JSObject();
            JSArray pageUris = new JSArray();

            List<GmsDocumentScanningResult.Page> pages = scanResult.getPages();
            if (pages != null) {
                for (GmsDocumentScanningResult.Page page : pages) {
                    pageUris.put(page.getImageUri().toString());
                }
            }
            ret.put("pages", pageUris);
            ret.put("pageCount", pages != null ? pages.size() : 0);

            GmsDocumentScanningResult.Pdf pdf = scanResult.getPdf();
            if (pdf != null) {
                ret.put("pdfUri", pdf.getUri().toString());
                ret.put("pageCount", pdf.getPageCount());
            }

            call.resolve(ret);
        } else if (result.getResultCode() == Activity.RESULT_CANCELED) {
            call.reject("Scan was cancelled by user");
        } else {
            call.reject("Scan failed with result code: " + result.getResultCode());
        }
    }
}
