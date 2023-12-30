package com.khakipost;

import static android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK;

import android.annotation.SuppressLint;
import android.app.IntentService;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
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

    public Khakipostsendmodulewhatsapp(ReactApplicationContext reactContext) {
        //required by React Native
        super(reactContext);
    }
 
    @NonNull
    @Override
    //getName is required to define the name of the module
    public String getName() { 
        return "DirectWhatsapp";
    }

//    @android.support.annotation.RequiresApi(api = Build.VERSION_CODES.DONUT)

    @SuppressLint("NewApi")
    @ReactMethod
    public void sendDirectWhatsapp(String phoneNumber, String msg,Callback callback) {
        try {
            Log.d("Whatsappmsg",msg);
            Log.d("WhatsappphoneNumber",phoneNumber);
            Log.d("Whatsappcallback",callback.toString());
//            SmsManager smsManager = null;
//            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.DONUT) {
//                smsManager = SmsManager.getDefault();
//
//                smsManager.sendTextMessage(phoneNumber, null, msg, null, null);
//                callback.invoke("MS");
//            }
            Intent i = new Intent();
            try {
                String url = "https://api.whatsapp.com/send?phone=" + phoneNumber + "&text=" + URLEncoder.encode(msg, "UTF-8");
                i.setAction(Intent.ACTION_VIEW);
                i.setPackage("com.whatsapp");
                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                i.setData(Uri.parse(url));
//            if (i.resolveActivity(packageManager) != null) {
                getReactApplicationContext().startActivity(i);
                callback.invoke("MS");
//            }
            } catch (Exception e){
                e.printStackTrace();
            }
            // return ;
        } catch (Exception ex) {
            callback.invoke(ex);
        } 
    }
    
}
