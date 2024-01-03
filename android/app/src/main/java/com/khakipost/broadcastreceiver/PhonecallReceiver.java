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

    }

}