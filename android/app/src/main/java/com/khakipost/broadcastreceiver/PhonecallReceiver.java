package com.khakipost.broadcastreceiver;

import static android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK;

import android.accessibilityservice.AccessibilityService;
import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.accessibility.AccessibilityNodeInfo;

import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;

import java.net.URLEncoder;
import java.util.Date;
import java.util.List;

public class PhonecallReceiver extends BroadcastReceiver {

    @SuppressLint("NewApi")
    @Override
    public void onReceive(Context context, Intent intent) {

        Intent startIntent = new Intent();
        try {
            System.out.println("OSAMA intent data" + intent.getData().toString());
            Uri url = intent.getData();
            startIntent.setAction(Intent.ACTION_VIEW);
            startIntent.setPackage("com.whatsapp");
            startIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startIntent.setData(url);
//            if (i.resolveActivity(packageManager) != null) {

            //first was apply changed to commit so working
            context.getSharedPreferences("KhakiPostConstants", Context.MODE_PRIVATE).edit().putBoolean("shouldSend", true).commit();
            context.startActivity(startIntent);

//            callback.invoke("MS");
            System.out.println("OSAMA PhonecallReceiver onReceive BEFORE");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}