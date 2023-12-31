package com.khakipost.broadcastreceiver;

import static android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK;

import android.accessibilityservice.AccessibilityService;
import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.telephony.TelephonyManager;
import android.view.accessibility.AccessibilityNodeInfo;

import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;

import java.net.URLEncoder;
import java.util.Date;
import java.util.List;

public class PhonecallReceiver extends BroadcastReceiver {
//The receiver will be recreated whenever android feels like it.  We need a static variable to remember data between instantiations
 //because the passed incoming is only valid in ringing
AccessibilityService accessibilityService;
public PhonecallReceiver(AccessibilityService accessibilityService) {
    this.accessibilityService = accessibilityService;
}

    @SuppressLint("NewApi")
    @Override
    public void onReceive(Context context, Intent intent) {
//    System.out.println("OSAMA onReceive BEFORE");
//        //We listen to two intents.  The new outgoing call only tells us of an outgoing call.  We use it to get the number.
////        if (intent.getAction().equals("android.intent.action.NEW_OUTGOING_CALL")) {
////            savedNumber = intent.getExtras().getString("android.intent.extra.PHONE_NUMBER");
////            System.out.println("OSAMA 1 " + savedNumber);
////        }
////        else{
////            String stateStr = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
//
//        if (accessibilityService.getRootInActiveWindow () == null) {
//            return;
//        }
//
//        AccessibilityNodeInfoCompat rootInActiveWindow = AccessibilityNodeInfoCompat.wrap (accessibilityService.getRootInActiveWindow ());
//        // Whatsapp Message EditText id
//        List<AccessibilityNodeInfoCompat> messageNodeList = rootInActiveWindow.findAccessibilityNodeInfosByViewId ("com.whatsapp:id/entry");
//        if (messageNodeList == null || messageNodeList.isEmpty ()) {
//            return;
//        }
//
//        // check if the whatsapp message EditText field is filled with text and ending with your suffix (explanation above)
//        AccessibilityNodeInfoCompat messageField = messageNodeList.get (0);
//        if (messageField.getText() == null || messageField.getText().length() == 0) { // So your service doesn't process any message, but the ones ending your apps suffix
//            return;
//        } else {
//            messageField.getText();
//        }
//
//        // Whatsapp send button id
//        List<AccessibilityNodeInfoCompat> sendMessageNodeInfoList = rootInActiveWindow.findAccessibilityNodeInfosByViewId ("com.whatsapp:id/send");
//        if (sendMessageNodeInfoList == null || sendMessageNodeInfoList.isEmpty ()) {
//            return;
//        }
//
//        AccessibilityNodeInfoCompat sendMessageButton = sendMessageNodeInfoList.get (0);
//        if (!sendMessageButton.isVisibleToUser ()) {
//            return;
//        }
//
//        // Now fire a click on the send button
//        sendMessageButton.performAction (AccessibilityNodeInfo.ACTION_CLICK);
//
//        // Now go back to your app by clicking on the Android back button twice:
//        // First one to leave the conversation screen
//        // Second one to leave whatsapp
//        try {
//            Thread.sleep (500); // hack for certain devices in which the immediate back click is too fast to handle
//            accessibilityService.performGlobalAction (GLOBAL_ACTION_BACK);
//            Thread.sleep (500);  // same hack as above
//        } catch (InterruptedException ignored) {}
//        accessibilityService.performGlobalAction (GLOBAL_ACTION_BACK);
//        System.out.println("OSAMA onReceive AFTER");
//            if (number != null) {
//                savedNumber = number;
//            }
//            int state = 0;
//            if(stateStr.equals(TelephonyManager.EXTRA_STATE_IDLE)){
//                state = TelephonyManager.CALL_STATE_IDLE;
//            }
//            else if(stateStr.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)){
//                state = TelephonyManager.CALL_STATE_OFFHOOK;
//            }
//            else if(stateStr.equals(TelephonyManager.EXTRA_STATE_RINGING)){
//                state = TelephonyManager.CALL_STATE_RINGING;
//            }

//            System.out.println("OSAMA 2 " + savedNumber);

//            onCallStateChanged(context, state, savedNumber);
//        }
    }

    //Derived classes should override these to respond to specific events of interest
//    protected abstract void onIncomingCallReceived(Context ctx, String number, Date start);
//    protected abstract void onIncomingCallAnswered(Context ctx, String number, Date start);
//    protected abstract void onIncomingCallEnded(Context ctx, String number, Date start, Date end);
//
//    protected abstract void onOutgoingCallStarted(Context ctx, String number, Date start);
//    protected abstract void onOutgoingCallEnded(Context ctx, String number, Date start, Date end);
//
//    protected abstract void onMissedCall(Context ctx, String number, Date start);
//
//    //Deals with actual events
//
//    //Incoming call-  goes from IDLE to RINGING when it rings, to OFFHOOK when it's answered, to IDLE when its hung up
//    //Outgoing call-  goes from IDLE to OFFHOOK when it dials out, to IDLE when hung up
//    public void onCallStateChanged(Context context, int state, String number) {
//    if(lastState == state){
//            //No change, debounce extras
//            return;
//        }
//        switch (state) {
//            case TelephonyManager.CALL_STATE_RINGING:
//                isIncoming = true;
//                callStartTime = new Date();
////                savedNumber = number;
//                onIncomingCallReceived(context, savedNumber, callStartTime);
//                break;
//            case TelephonyManager.CALL_STATE_OFFHOOK:
//                //Transition of ringing->offhook are pickups of incoming calls.  Nothing done on them
//                if(lastState != TelephonyManager.CALL_STATE_RINGING){
//                    isIncoming = false;
//                    callStartTime = new Date();
//                    onOutgoingCallStarted(context, savedNumber, callStartTime);
//                }
//                else
//                {
//                    isIncoming = true;
//                    callStartTime = new Date();
//                    onIncomingCallAnswered(context, savedNumber, callStartTime);
//                }
//
//                break;
//            case TelephonyManager.CALL_STATE_IDLE:
//                //Went to idle-  this is the end of a call.  What type depends on previous state(s)
//                if(lastState == TelephonyManager.CALL_STATE_RINGING){
//                    //Ring but no pickup-  a miss
//                    onMissedCall(context, savedNumber, callStartTime);
//                }
//                else if(isIncoming){
//                    onIncomingCallEnded(context, savedNumber, callStartTime, new Date());
//                }
//                else{
//                    onOutgoingCallEnded(context, savedNumber, callStartTime, new Date());
//                }
//                break;
//        }
//        lastState = state;
//    }

}