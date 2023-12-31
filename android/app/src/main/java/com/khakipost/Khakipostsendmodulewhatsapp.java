package com.khakipost;

import static android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK;

import android.accessibilityservice.AccessibilityService;
import android.annotation.SuppressLint;
import android.app.IntentService;
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

    GlobalActionBarService accessibilityService;

    public Khakipostsendmodulewhatsapp(ReactApplicationContext reactContext) {
        super(reactContext);
        //required by React Native
accessibilityService = GlobalActionBarService.accessibilityService;
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
//            Log.d("Whatsappcallback",callback.toString());
//            SmsManager smsManager = null;
//            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.DONUT) {
//                smsManager = SmsManager.getDefault();
//
//                smsManager.sendTextMessage(phoneNumber, null, msg, null, null);
//                callback.invoke("MS");
//            }
            String url = "https://api.whatsapp.com/send?phone=" + phoneNumber + "&text=" + URLEncoder.encode(msg, "UTF-8");
            Uri urlData = Uri.parse(url);
            Intent startIntent = new Intent();
            try {
//            String url = urlData.toString();
                startIntent.setAction(Intent.ACTION_VIEW);
                startIntent.setPackage("com.whatsapp");
                startIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startIntent.setData(urlData);
//            if (i.resolveActivity(packageManager) != null) {
                getReactApplicationContext().startActivity(startIntent);


                System.out.println("OSAMA onReceive BEFORE");
                //We listen to two intents.  The new outgoing call only tells us of an outgoing call.  We use it to get the number.
//        if (intent.getAction().equals("android.intent.action.NEW_OUTGOING_CALL")) {
//            savedNumber = intent.getExtras().getString("android.intent.extra.PHONE_NUMBER");
//            System.out.println("OSAMA 1 " + savedNumber);
//        }
//        else{
//            String stateStr = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);

                new Handler().postDelayed(() -> {
                    if (accessibilityService.getRootInActiveWindow() == null) {
                    return;
                }

                    AccessibilityNodeInfoCompat rootInActiveWindow = AccessibilityNodeInfoCompat.wrap (accessibilityService.getRootInActiveWindow ());
                    // Whatsapp Message EditText id
                    List<AccessibilityNodeInfoCompat> messageNodeList = rootInActiveWindow.findAccessibilityNodeInfosByViewId ("com.whatsapp:id/entry");
                    if (messageNodeList == null || messageNodeList.isEmpty ()) {
                        return;
                    }

                    // check if the whatsapp message EditText field is filled with text and ending with your suffix (explanation above)
                    AccessibilityNodeInfoCompat messageField = messageNodeList.get (0);
                    if (messageField.getText() == null || messageField.getText().length() == 0) { // So your service doesn't process any message, but the ones ending your apps suffix
                        return;
                    } else {
                        messageField.getText();
                    }

                    // Whatsapp send button id
                    List<AccessibilityNodeInfoCompat> sendMessageNodeInfoList = rootInActiveWindow.findAccessibilityNodeInfosByViewId ("com.whatsapp:id/send");
                    if (sendMessageNodeInfoList == null || sendMessageNodeInfoList.isEmpty ()) {
                        return;
                    }

                    AccessibilityNodeInfoCompat sendMessageButton = sendMessageNodeInfoList.get (0);
                    if (!sendMessageButton.isVisibleToUser ()) {
                        return;
                    }

                    // Now fire a click on the send button
                    sendMessageButton.performAction (AccessibilityNodeInfo.ACTION_CLICK);

                    // Now go back to your app by clicking on the Android back button twice:
                    // First one to leave the conversation screen
                    // Second one to leave whatsapp
                    try {
                        Thread.sleep (500); // hack for certain devices in which the immediate back click is too fast to handle
                        accessibilityService.performGlobalAction (GLOBAL_ACTION_BACK);
                        Thread.sleep (500);  // same hack as above
                    } catch (InterruptedException ignored) {}
                    accessibilityService.performGlobalAction (GLOBAL_ACTION_BACK);
                    System.out.println("OSAMA onReceive AFTER");
                }, 8000);

//            }
            } catch (Exception e){
                e.printStackTrace();
            }
//            Intent i = new Intent();
//            try {
//
//                i.setAction(Intent.ACTION_VIEW);
//                i.setPackage("com.whatsapp");
//                i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//                i.setData(Uri.parse(url));
////            if (i.resolveActivity(packageManager) != null) {
//                System.out.println("OSAMA BEFORE BROADCAST");
//                final Handler handler = new Handler(Looper.getMainLooper());
//                handler.postDelayed(() -> {
//                    getReactApplicationContext().sendBroadcast(i);
//                    System.out.println("OSAMA AFTER BROADCAST");
//                }, 5000);
////                callback.invoke("MS");
////            }
//            } catch (Exception e){
//                e.printStackTrace();
//            }
            // return ;
        } catch (Exception ex) {
            callback.invoke(ex);
        } 
    }
    
}
