package com.khakipost;

import android.telephony.SmsManager;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class Khakipostsendmodulewhatsapp extends ReactContextBaseJavaModule {

    public Khakipostsendmodulewhatsapp(ReactApplicationContext reactContext) {
        //required by React Native
        super(reactContext);
    }
 
    @Override
    //getName is required to define the name of the module
    public String getName() { 
        return "DirectWhatsapp";
    }
 
    @ReactMethod
    public void sendDirectSms(String phoneNumber, String msg,Callback callback) {
        try {
            Log.d("Whatsappmsg",msg);
            Log.d("WhatsappphoneNumber",phoneNumber);
            Log.d("Whatsappcallback",callback.toString());
            SmsManager smsManager = null;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.DONUT) {
                smsManager = SmsManager.getDefault();

                smsManager.sendTextMessage(phoneNumber, null, msg, null, null);
                callback.invoke("MS");
            }
            
            // return ;
        } catch (Exception ex) {
            callback.invoke(ex);
        } 
    }
    
}
