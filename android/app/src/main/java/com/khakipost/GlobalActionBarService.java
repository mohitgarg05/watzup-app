// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.khakipost;

import android.accessibilityservice.AccessibilityService;
import android.annotation.SuppressLint;
import android.content.IntentFilter;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import androidx.core.view.accessibility.AccessibilityNodeInfoCompat;

import com.khakipost.broadcastreceiver.PhonecallReceiver;

import java.util.List;


@SuppressLint("NewApi")
public class GlobalActionBarService extends AccessibilityService {

    private PhonecallReceiver receiver;

    @Override
    public void onCreate() {
        super.onCreate();

        System.out.println("OSAMA onCreate");
        IntentFilter filter = new IntentFilter();
        filter.addAction("android.intent.action.NEW_OUTGOING_CALL");
        filter.addAction("android.intent.action.PHONE_STATE");

        receiver = new PhonecallReceiver();

        registerReceiver(receiver, filter);
//        Intent i = new Intent(getApplicationContext(), MainActivity.class);
//        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
//        startActivity(i);
    }

    @Override
    public void onDestroy() {
        System.out.println("OSAMA onDestroy");
        unregisterReceiver(receiver);
        super.onDestroy();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        System.out.println("OSAMA onAccessibilityEvent Start");
        if (getRootInActiveWindow() == null) {
            return;
        }

        AccessibilityNodeInfoCompat rootInActiveWindow = AccessibilityNodeInfoCompat.wrap(getRootInActiveWindow());

        // Whatsapp Message EditText id
        List<AccessibilityNodeInfoCompat> messageNodeList;
        try {
            messageNodeList = rootInActiveWindow.findAccessibilityNodeInfosByViewId("com.whatsapp:id/entry");
        } catch (Exception e) {
            return;
        }
        if (messageNodeList == null || messageNodeList.isEmpty()) {
            return;
        }

        // check if the whatsapp message EditText field is filled with text and ending with your suffix (explanation above)
        AccessibilityNodeInfoCompat messageField = messageNodeList.get(0);
        if (messageField.getText() == null || messageField.getText().length() == 0) { // So your service doesn't process any message, but the ones ending your apps suffix
            return;
        }
        if (!messageField.getText().toString().endsWith("Powered by KhakiPost Marketing App | 8422003305")) {
            return;
        }

        // Whatsapp send button id
        List<AccessibilityNodeInfoCompat> sendMessageNodeInfoList = rootInActiveWindow.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send");
        if (sendMessageNodeInfoList == null || sendMessageNodeInfoList.isEmpty()) {
            return;
        }

        AccessibilityNodeInfoCompat sendMessageButton = sendMessageNodeInfoList.get(0);
        if (!sendMessageButton.isVisibleToUser()) {
            return;
        }

        if (getSharedPreferences("KhakiPostConstants",MODE_PRIVATE).getBoolean("shouldSend", false) == false) {
            return;
        }
        //first was apply changed to commit so working
        getSharedPreferences("KhakiPostConstants",MODE_PRIVATE).edit().putBoolean("shouldSend", false).commit();

        // Now fire a click on the send button
        sendMessageButton.performAction(AccessibilityNodeInfo.ACTION_CLICK);

        // Now go back to your app by clicking on the Android back button twice:
        // First one to leave the conversation screen
        // Second one to leave whatsapp
        try {
            Thread.sleep(500); // hack for certain devices in which the immediate back click is too fast to handle
            performGlobalAction(GLOBAL_ACTION_BACK);
            Thread.sleep(500);  // same hack as above
        } catch (InterruptedException ignored) {
        }
        performGlobalAction(GLOBAL_ACTION_BACK);
        System.out.println("OSAMA onAccessibilityEvent End");
    }

    @Override
    public void onInterrupt() {
        System.out.println("OSAMA INT");
    }
}
