package com.khakipost;
 
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.uimanager.IllegalViewOperationException;

import android.annotation.SuppressLint;
import android.telephony.SmsManager;
import android.app.PendingIntent;
import android.util.Log;
public class Khakipostsendmodule extends ReactContextBaseJavaModule {
 
    public Khakipostsendmodule(ReactApplicationContext reactContext) {
        //required by React Native
        super(reactContext);
    }
 
    @Override
    //getName is required to define the name of the module
    public String getName() { 
        return "DirectSms";
    }

    @SuppressLint("NewApi")
    @ReactMethod
    public void sendDirectSms(String phoneNumber, String msg,Callback callback) {
        try {  
            Log.d("RCNative",msg);
            Log.d("RCNative",phoneNumber);
            Log.d("RCNative",callback.toString());
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phoneNumber, null, msg, null, null);
            callback.invoke("MS");
            
            // return ;
        } catch (Exception ex) {
            callback.invoke(ex);
        } 
    }
    
}
