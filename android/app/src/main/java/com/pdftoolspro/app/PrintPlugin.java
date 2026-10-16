package com.pdftoolspro.app;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "NativePrint")
public class PrintPlugin extends Plugin {

    @PluginMethod
    public void printPdf(PluginCall call) {
        String filePath = call.getString("filePath");
        String jobName = call.getString("jobName", "PDF Tools Pro Document");

        if (filePath == null) {
            call.reject("filePath is required");
            return;
        }

        Context context = getContext();
        if (context == null) {
            call.reject("Context is null");
            return;
        }

        PrintManager printManager = (PrintManager) context.getSystemService(Context.PRINT_SERVICE);
        if (printManager == null) {
            call.reject("PrintManager service not available on device");
            return;
        }

        try {
            Uri fileUri = Uri.parse(filePath);
            PrintDocumentAdapter printAdapter = new PrintDocumentAdapter() {
                @Override
                public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                     CancellationSignal cancellationSignal,
                                     LayoutResultCallback callback, Bundle extras) {
                    if (cancellationSignal.isCanceled()) {
                        callback.onLayoutCancelled();
                        return;
                    }
                    PrintDocumentInfo pdi = new PrintDocumentInfo.Builder(jobName)
                            .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                            .build();
                    callback.onLayoutFinished(pdi, true);
                }

                @Override
                public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                                    CancellationSignal cancellationSignal,
                                    WriteResultCallback callback) {
                    InputStream input = null;
                    OutputStream output = null;
                    try {
                        if (filePath.startsWith("content://")) {
                            input = context.getContentResolver().openInputStream(fileUri);
                        } else {
                            input = new FileInputStream(new File(fileUri.getPath()));
                        }
                        output = new FileOutputStream(destination.getFileDescriptor());

                        byte[] buf = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = input.read(buf)) > 0) {
                            if (cancellationSignal.isCanceled()) {
                                callback.onWriteCancelled();
                                return;
                            }
                            output.write(buf, 0, bytesRead);
                        }
                        callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                    } catch (Exception e) {
                        callback.onWriteFailed(e.getMessage());
                    } finally {
                        try {
                            if (input != null) input.close();
                            if (output != null) output.close();
                        } catch (Exception ignored) {}
                    }
                }
            };

            printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());

            JSObject ret = new JSObject();
            ret.put("status", "printing_started");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to print PDF: " + e.getMessage(), e);
        }
    }
}
