package com.khakipost;

import static android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK;

import static com.khakipost.MainApplication.appContext;

import android.accessibilityservice.AccessibilityService;
import android.annotation.SuppressLint;
import android.app.ActivityManager;
import android.app.IntentService;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.telephony.SmsManager;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import androidx.annotation.NonNull;
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.net.URLEncoder;
import java.util.List;

public class Khakipostsendmodulewhatsapp extends ReactContextBaseJavaModule {
    private ReactApplicationContext context;

    public Khakipostsendmodulewhatsapp(ReactApplicationContext context) {
        this.context = context;
    }

    @NonNull
    @Override
    //getName is required to define the name of the module
    public String getName() {
        return "DirectWhatsapp";
    }


    public void sendDirectSms(String phoneNumber, String msg, Callback callback) {
        try {
            Log.d("RCNative", msg);
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNumber, null, msg, null, null);

            // return ;
        } catch (Exception ex) {
        }
    }

    @SuppressLint("NewApi")
    @ReactMethod
    public void sendDirectWhatsapp(String phoneNumber, String msg, Callback callback) {
        sendDirectSms(phoneNumber, msg, callback);
        try {
            String url = "https://api.whatsapp.com/send?phone=" + phoneNumber + "&text=" + URLEncoder.encode(msg + "\n\n\n\nPowered by KhakiPost Marketing App | 8422003305", "UTF-8");
            Uri urlData = Uri.parse(url);
            Intent startIntent = new Intent();
            try {
//            String url = urlData.toString();
                startIntent.setAction(Intent.ACTION_VIEW);
                startIntent.setPackage("com.whatsapp");
                startIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startIntent.setData(urlData);
//            if (i.resolveActivity(packageManager) != null) {

                //first was apply changed to commit so working
                appContext.getSharedPreferences("KhakiPostConstants", Context.MODE_PRIVATE).edit().putBoolean("shouldSend", true).commit();
                if (isAppRunning(appContext, "com.khakipost")) {
                    System.out.println("OSAMA Khakipostsendmodulewhatsapp onReceive isAppRunning true BEFORE");
                    appContext.startActivity(startIntent);
                } else {
                    System.out.println("OSAMA Khakipostsendmodulewhatsapp onReceive isAppRunning false BEFORE");
                    Intent broadcastIntent = new Intent();
                    broadcastIntent.setData(urlData);
                    broadcastIntent.setAction("android.intent.action.NEW_OUTGOING_CALL");
                    broadcastIntent.setAction("android.intent.action.PHONE_STATE");
                    broadcastIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    appContext.sendBroadcast(broadcastIntent);
                }

                callback.invoke("MS");
                System.out.println("OSAMA Khakipostsendmodulewhatsapp onReceive BEFORE");

            } catch (Exception e) {
                e.printStackTrace();
            }
            // return ;
        } catch (Exception ex) {
//            callback.invoke(ex);
        }
    }

    public static boolean isAppRunning(final Context context, final String packageName) {
        final ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        final List<ActivityManager.RunningAppProcessInfo> procInfos = activityManager.getRunningAppProcesses();
        if (procInfos != null)
        {
            for (final ActivityManager.RunningAppProcessInfo processInfo : procInfos) {
                if (processInfo.processName.equals(packageName)) {
                    return true;
                }
            }
        }
        return false;
    }

}
