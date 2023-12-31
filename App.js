import React, {Component, useEffect, useState,useCallback} from 'react';
import {
    NativeModules,
    PermissionsAndroid,
    Alert,
    ScrollView,
    StyleSheet,
    View,
    TextInput,
    Text,
    Button,
    Switch,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Linking,
    ToastAndroid,
} from 'react-native';
import { NavigationContainer,useNavigation,useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Contacts from 'react-native-contacts';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import md5 from 'md5';
import _ from 'lodash';
import DocumentPicker, { types } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faUpload,faCommentSms,faClock,faUsers,faFlag,faTrash,faReply, faCogs } from '@fortawesome/free-solid-svg-icons'
import BackgroundService from 'react-native-background-actions';
import { version,name } from './package.json';
import CallDetectorManager from 'react-native-call-detection';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { SafeAreaView } from 'react-native-safe-area-context';
import MultiSelect from 'react-native-multiple-select';
//import hm from './e01';

var DirectWhatsapp = NativeModules.DirectWhatsapp;
var SendwithSub = NativeModules.SendwithSub;
const Stack = createStackNavigator();

var sent_list = []
const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));
const cdelay = ms => new Promise(res => setTimeout(res, ms));

var syncconls = []
var syntemp = []

var isCampaign = 0

BackgroundService.on('expiration',async ()=>{
    var date = new Date()
    Alert('dead',date);

})
var g_whois = '';
var g_email = '';
var g_did = '';
var cmsgtext = '';
var cmsgid = '';
var isconsync = 1
var isincoming = 0;
var isdailed = 0;
var iscompleted = 0;
var isreeep = [];
var refTimer = 1000;
var camcount = 0;
var campid = "";
var campwho = "";
var campdata = [];
var lastdelay = 1000;
var defdelay = 2000;
var delayrange = [10000,12000,13000]
var isCampgo = false;
var isconsync = false;
var keepalive_timer = 0;
var payload_len = 0;
var entry = []
ar_templist = []
const storeData = async (dbname,values) => {
    const res =  await AsyncStorage.setItem(dbname, JSON.stringify(values)).then((g)=>{
        return "done"
      }).catch((e)=>{
        return "error"
      })
    return res
};
const getData= async (dbname) => {
    try {
      const savedUser = await AsyncStorage.getItem(dbname);
      return JSON.parse(savedUser);
    } catch (error) {
      console.log(error);
    }
};
const get_uni_key = async ()=>{
    var aid = await DeviceInfo.getAndroidId().then((aids)=>{ return aids});
    var bid = await DeviceInfo.getBuildId().then((bids)=>{ return bids })

    return aid+"_"+bid
}
const consync = () =>{
    Contacts.getAll().then(async (contacts) => {
    var contac =  contacts.filter(element => element.displayName !== null)
    var sorted_con = contac.sort((a,b)=>a.displayName.localeCompare(b.displayName));
    var filtered_con = sorted_con.filter(element => element.phoneNumbers[0] !== undefined);
    var newfiltered_con = filtered_con.filter(element => element.phoneNumbers[0].number !== undefined  || element.phoneNumbers[0].number.length !== 0);
    newfiltered_con.forEach((nfc,indx)=>{
        if(syncconls.includes({name:nfc.displayName,num:nfc.phoneNumbers[0].number+"_"+nfc.displayName})){
        }else{
            syncconls.push({name:nfc.displayName,num:nfc.phoneNumbers[0].number+"_"+nfc.displayName})
        }
    })
    isconsync = false
        // syncconls = newfiltered_con;
    }).catch((e)=>{
        //hm.pusherrorlog('GET_CONSYNC_95',e)
    })
}


const randomTask =  async taskdata =>{
    await new Promise(async resolve =>{
        const {delay} = taskdata;
        for(let i = 0; BackgroundService.isRunning(); i++){
            if(keepalive_timer === 120){
                keepalive_timer = 0
                getData("isuser").then((data)=>{
                    fetch('http://senderapp.xysales.com/keepalive/', {
                            method: 'POST',
                            mode:'cors',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                "usr": data.uid,
                                "devv":DeviceInfo.getSystemVersion(),
                                "dname":DeviceInfo.getModel()+"_"+DeviceInfo.getBrand()+"_"+DeviceInfo.getSystemName(),
                                "st":new Date().toISOString(),
                                "et":new Date().toISOString(),
                                "apkv":version,
                            })
                        }).then((response) => response.json())
                        .then((responseJson) => {
                            console.log("keepalive triggered",responseJson)
                        }).catch(er=>{
                            console.log("jack")
                            console.log(er)
                        });
                }).catch((e)=>{
                    console.log(e)
                })
            }
            if(isCampaign === 1){
                getData("exls").then(async (isexls)=>{
                    if(isexls.xls !== "undefined" || isexls.xls.length !== 0){
                        for(let j = 0; j <= campdata.length;){
                            if(campdata[j] !== undefined){
                                if(isexls.xls.includes(campdata[j].num.split("_")[0].replace(/ /g,''))){
                                }else{
                                    var rand = Math.floor(Math.random() * 60000)
                                    console.log(j,"-------------------->",campdata[j],new Date().toLocaleString().split(',')[1],"_",rand)
                                    sendcampaign(campdata[j],cmsgid,cmsgtext)
                                    await cdelay(rand)
                                    j++
                                }
                            }
                        }
                    }else{
                        for(let j = 0; j <= campdata.length;){
                            if(campdata[j] !== undefined){
                                var rand = Math.floor(Math.random() * 60000)
                                console.log(j,"-------------------->",campdata[j],new Date().toLocaleString().split(',')[1],"_",rand)
                                sendcampaign(campdata[j],cmsgid,cmsgtext)
                                await cdelay(rand)
                                j++
                            }
                        }
                    }
                }).catch(async (er)=>{
                    pusherrorlog("new_send_error_log",er)
                    for(let j = 0; j <= campdata.length;){
                        if(campdata[j] !== undefined){
                            var rand = Math.floor(Math.random() * 60000)
                            console.log(j,"-------------------->",campdata[j],new Date().toLocaleString().split(',')[1],"_",rand)
                            sendcampaign(campdata[j],cmsgid,cmsgtext)
                            await cdelay(rand)
                            j++
                        }
                    }
                })
                await sleep(delay);
                isCampaign = 0
                isCampgo = true
            }else if(isCampgo === true && camcount <= 100){
                if(camcount >= syncconls.length){
                    console.log(syncconls.length,camcount)
                }else{
                    await BackgroundService.updateNotification({taskDesc: 'Marketing Campaign '+camcount+'/100'}).catch(e=>console.log(e));
                }
            }else if(camcount >= 100 || camcount === syncconls.length){
                await BackgroundService.updateNotification({taskDesc: 'Marketing Campaign Completed '+camcount+'/100'}).catch(e=>console.log(e));
                await cdelay(1000)
                isCampaign = 0
                isCampgo = false
                camcount = 0
            }else{
                if(isconsync === true){
                    consync()
                }
                await BackgroundService.updateNotification({taskDesc: 'running -> '+i}).catch(e=>console.log(e));
                await sleep(delay);
            }
            keepalive_timer += 1
        }
    })
}

const sendcampaign = async (payload,msid,msgtxt)=>{
    getData(msid).then((data)=>{
        var new_array = data.donels.split("_")
            if(new_array.includes(payload.num.split("_")[0])){ console.log("already there ",payload.num.split("_")[0]," In ",new_array)
            }else{
                ar_templist.push(payload.num.split("_")[0])
                DirectWhatsapp.sendDirectWhatsapp(payload.num.split("_")[0],msgtxt.replace(/#_/g,"'"),(smsRes)=>{
                    if(smsRes === "MS"){
                        storeData(msid,{donels:data.donels+"_"+payload.num.split("_")[0]}).then((sdata)=>{
                            if(sdata === "done"){
                                camcount += 1
                                console.log(data.donels+"_"+payload.num.split("_")[0])
                                console.log("message sent in else ",payload.num.split("_")[0]," In ",new_array)
                                entry.push("sent "+payload.num.split("_")[0]+" | "+payload.num.split("_")[1]+" "+new Date().toLocaleString().split(',')[1]+"\n")
                            }else{
                                console.log("ELSE")
                            }
                        }).catch((se)=>{
                            console.log("se------------------>",se)
                            pusherrorlog('STARTMESSAGE_ELSE_ERR',se)
                        })
                    }else{
                        console.log("message failed",payload.num.split("_")[0]," In ",new_array)
                    }
                });
            }
    }).catch((es)=>{
        pusherrorlog('STARTMESSAGE_ELSE_ES',es)
        console.log("es------------------>",es)
        ar_templist.push(payload.num.split("_")[0])
        DirectWhatsapp.sendDirectWhatsapp(payload.num.split("_")[0],msgtxt.replace(/#_/g,"'"),(smsRes)=>{
            if(smsRes === "MS"){
                storeData(msid,{donels:payload.num.split("_")[0]}).then((sdata)=>{
                    if(sdata === "done"){
                        camcount += 1
                        console.log("message sent in catch ",payload.num.split("_")[0]," In ")
                        entry.push("sent "+payload.num.split("_")[0]+" | "+payload.num.split("_")[1]+" "+new Date().toLocaleString().split(',')[1]+"\n")
                    }else{ console.log("ELSE")}
                }).catch((se)=>{
                    console.log('ess=-------------------------------------->',se)
                    pusherrorlog('STARTMESSAGE_ELSE_ERR',se)
                })
            }else{console.log("message failed",payload.num.split("_")[0]," In ")}
        });
    })
}

const options = {
    taskName: 'KhakiPostRunning',
    taskTitle: 'KhakiPost Running...',
    taskDesc: 'Marketing App To Grow Your Business',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#ff00ff',
    parameters: {
        delay: refTimer,
    },
};

const startB = async ()=>{
    try{
        await BackgroundService.start(randomTask,options);

        // await BackgroundService.updateNotification({taskDesc: 'running -> '}).catch(e=>console.log(e));
    }catch(e){
        console.log(e)
    }

}


const stopB = async ()=>{
    try{
        await BackgroundService.stop();
    }catch(e){
        console.log(e)
    }

}

const pusherrorlog = (err_title,par_err) =>{
    console.log(DeviceInfo.getModel())
    console.log(DeviceInfo.getBrand())
    console.log(DeviceInfo.getSystemName())
    console.log(DeviceInfo.getSystemVersion())
    getData("isuser").then((data)=>{
        fetch('http://senderapp.xysales.com/report/', {
                method: 'POST',
                mode:'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "ticket":err_title,
                    "username": data.uid,
                    "av":DeviceInfo.getSystemVersion(),
                    "errlog":par_err.toString().replace(/'/g,'"'),
                    "dname":DeviceInfo.getModel()+"_"+DeviceInfo.getBrand()+"_"+DeviceInfo.getSystemName(),
                    "device":data.did,
                })
            }).then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if(responseJson.status === "submited"){
                    console.log(responseJson)
                    console.log(typeof e)
                }else{
                    console.log(responseJson)
                    console.log(e.toString().replace(/'/g,'"'))
                }
            }).catch(er=>{
                console.log("jack")
                console.log(er)
            });
    }).catch((e)=>{
        console.log(e)
    })

}
const askReques = async ()=>{
    try {
        const smsgranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'Send SMS App Sms Permission',
            message:
              'Send SMS App needs access to your inbox ' +
              'so you can send messages in background.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (smsgranted === PermissionsAndroid.RESULTS.GRANTED) {
            const con_granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                {
                  title: 'Contacts',
                  message:
                    'KhakiPost Send required Contact access for' +
                    'sending messages',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                },
            );
            if(con_granted === PermissionsAndroid.RESULTS.GRANTED){
                console.log("done")
            }else{
                alert("App required one more permission")
           }
        } else {
            const con_granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                {
                  title: 'Contacts',
                  message:
                    'KhakiPost required Contact access for' +
                    'sending messages',
                  buttonNeutral: 'Ask Me Later',
                  buttonNegative: 'Cancel',
                  buttonPositive: 'OK',
                },
            );
            if(con_granted === PermissionsAndroid.RESULTS.GRANTED){
                alert("App required one more permission to work")
            }else{
                alert("App required both permission to work")
            }
        }
      } catch (error) {
        console.warn(error);
        alert(error);
    }

}






// page routers
function InitScreen({ navigation }){
    var [inipage,setinipage] = useState('HomeScreen');
    var [aids,setadis] = useState();
    var [bids,setbdis] = useState();
    var [ppass,setppass] = useState(true);
    var [perr,setperr] = useState();
    // askReq()
    const ask = async ()=>{
        try {
            console.log(1)
            const smsgranted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.SEND_SMS,
              {
                title: 'KhakiPost App SMS Permission',
                message:
                  'KhakiPost App needs access to your inbox ' +
                  'so you can send messages in background.',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            console.log(2)
            if (smsgranted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log(3)
                const con_granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                    {
                      title: 'Contacts',
                      message:
                        'KhakiPost required Contact access for' +
                        'sending messages',
                      buttonNegative: 'Cancel',
                      buttonPositive: 'OK',
                    },
                );
                if(con_granted === PermissionsAndroid.RESULTS.GRANTED){
                    console.log(4)
                    isconsync = true
                    consync()
                    const RPS = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
                        {
                          title: 'Phone state',
                          message:
                            'KhakiPost required Phone State access for' +
                            'sending messages',
                          buttonNegative: 'Cancel',
                          buttonPositive: 'OK',
                        },
                    );
                    if(RPS === PermissionsAndroid.RESULTS.GRANTED){
                        console.log(5)
                        const WRS = await PermissionsAndroid.request(
                            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                            {
                              title: 'Media Storage',
                              message:
                                'KhakiPost required Phone State access for' +
                                'sending messages',
                              buttonNegative: 'Cancel',
                              buttonPositive: 'OK',
                            },
                        );
                        if(DeviceInfo.getSystemVersion() === "13" || DeviceInfo.getSystemVersion() === 13 || WRS === PermissionsAndroid.RESULTS.GRANTED){

                        console.log(6)
                            const RCL = await PermissionsAndroid.request(
                                PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
                                {
                                  title: 'Read Call Logs',
                                  message:
                                    'KhakiPost required Phone State access for' +
                                    'sending messages',
                                  buttonNegative: 'Cancel',
                                  buttonPositive: 'OK',
                                },
                            );
                            if(RCL === PermissionsAndroid.RESULTS.GRANTED){
                                console.log(7)
                                setperr(true)
                                // return "permission done"
                                getData('isuser').then((data)=>{
                                    if(!data){
                                        console.log(8)
                                        console.log(data," empyt");
                                        setppass(false)
                                    }else{
                                        console.log(9)
                                        get_uni_key().then(async (halfunikey)=>{
                                            console.log(10)
                                            g_did = data.did;
                                            g_email = data.uid
                                            g_whois = data.un
                                            if(DeviceInfo.getDeviceId()+"_"+halfunikey === data.did){
                                                fetch(`http://senderapp.xysales.com/khakiv2`,{
                                                    method: 'POST',
                                                    mode:'cors',
                                                    headers: {
                                                        'Accept': 'application/json',
                                                        'Content-Type': 'application/json'
                                                    },
                                                    body: JSON.stringify({
                                                        dataid:data.did,
                                                        appver:version,
                                                    })
                                                }).then((response) => response.json())
                                                .then((responseJson) => {
                                                    console.log("jack",responseJson)
                                                    if(responseJson.status === "updated"){
                                                        navigation.navigate("HomeScreen")
                                                        // navigation.navigate("ApkUpdate")
                                                    }else if(responseJson.status === "updatereq"){
                                                        navigation.navigate("ApkUpdate")
                                                    }else if(responseJson.status === "failed_S"){
                                                        navigation.navigate("SUSPEND")
                                                    }else if(responseJson.status === "failed_R"){
                                                        navigation.navigate("CommonErr",{id:"relogin",title:"Need To Re-login",msg:"something went wrong please relogin"})
                                                    }else{
                                                        setppass(true)
                                                    }
                                                }).catch(e=>{

                                                    console.log(11)

                                                    navigation.navigate("HomeScreen")
                                                })
                                            }
                                        })
                                    }
                                }).catch(es=>{
                                    setppass(false)
                                    console.log(12)
                                    console.log(es)
                                });
                            }else{
                                console.log(13)
                                setperr(false)
                            }
                        }else{
                            console.log(14)

                            setperr(false)
                        }
                    }else{
                        console.log(15)

                        setperr(false)
                    }
                }else{
                    console.log(16,con_granted)

                    setperr(false)
                }
            }else if(smsgranted === PermissionsAndroid.RESULTS.DENIED){
                console.log(smsgranted)
                setperr(false)
            }else if(smsgranted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN){
                console.log(smsgranted)
                setperr(false)
            }
          } catch (error) {
            console.log("err")
            setppass(false)
            console.log(error);
            pusherrorlog('permission_error',error)
        }
    }
    useEffect(()=>{
        ask()
        console.log(perr)
        console.log(ppass)
    },[]);

    return (
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
                <Text style={styles.logotxt1}>KhakiPost</Text>
                <Text style={styles.tagtxt1}>The Best Marketing App You Need To GROW Your Business</Text>
                <View style={styles.viewhome}>
                {ppass === true ?
                    <ActivityIndicator /> : perr === false ?
                    <TouchableOpacity style={styles.btn1} onPress={() => Linking.openSettings()}>
                        <Text style={styles.btntxt1}>Permission Required</Text>
                    </TouchableOpacity> : <TouchableOpacity style={styles.btn1} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.btntxt1}>Get Started</Text>
                    </TouchableOpacity>}
                </View>
            </View>
        </SafeAreaView>
    );
}

function SuspendScreen({ navigation }){
    return (
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
            <Text style={styles.logotxt1}>KhakiPost</Text>
            <Text style={styles.tagtxt1}>Bringing Enterprise Marketing Weapons to SMB's & Startups</Text>
            <View style={styles.vm1}>
                <Text style={styles.h3} >Your account is <Text style={styles.danger}>suspended</Text>.</Text>
                <Text style={styles.tagtxt1}>Kindly contact KhakiPost Support 9930918441 for more details</Text>
            </View>
        </View>
        </SafeAreaView>
    );
}

function CommonErrScreen({ route, navigation }){
    const {id,title,msg} = route.params;
    return (
        <SafeAreaView style={styles.safebodycontainer}>

        <View style={styles.homebodycontainer}>
            <Text style={styles.logotxt2}>KhakiPost App</Text>
            <Text style={styles.tagtxt1}>Bringing Enterprise Marketing Weapons to SMB's & Startups</Text>
            <View >
                <Text >{title}</Text>
                <Text>{msg}</Text>
                {id === 'relogin' ? <View center marginT-100><Button onPress={() => navigation.navigate('Login')} title="Re-login"></Button></View> : null}
            </View>
        </View>
        </SafeAreaView>
    );
}


function UpdateScreen({ navigation }){
    return (
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
                <Text style={styles.logotxt2}>KhakiPost {version}</Text>
                <Text style={styles.tagtxt2}>We've just got better</Text>
                <Text style={[styles.txtdarl]}>We have fixed some bug  and made the experience better for you</Text>
                <View style={styles.vm1}>
                    <TouchableOpacity style={styles.btn1} onPress={() => Linking.openURL('http://senderapp.xysales.com/apk/latest')}>
                        <Text style={styles.btntxt1}>Update App</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}


function SyncUpdate({ navigation }){
    var[newsyncconls,setnewsyncconls] = useState()
    useEffect(()=>{
        Contacts.getAll().then((contacts) => {
            var sorted_con = contacts.sort((a,b)=>a.displayName.localeCompare(b.displayName));
            var filtered_con = sorted_con.filter(element => element.phoneNumbers[0] !== undefined);
            var newfiltered_con = filtered_con.filter(element => element.phoneNumbers[0].number !== undefined  || element.phoneNumbers[0].number.length !== 0);

            console.log(newfiltered_con)
            syncconls = newfiltered_con;
        }).catch((e)=>{
            console.log(e)
        })
    },[]);
    return(
        <SafeAreaView style={styles.SafeAreaView}>
            <View style={styles.homebodycontainer}>
                <Text style={styles.tagtxt2}>
                    Updating contact list
                </Text>
                <ActivityIndicator size={'large'}/>
            </View>
        </SafeAreaView>
    );
}

function LoginScreen({ navigation }){
    var [aids,setadis] = useState();
    var [bids,setbdis] = useState();
    var [pnum,setpnum] = useState(pnum);
    var [email,setemail] = useState(email);

    useEffect(()=>{
        DeviceInfo.getAndroidId().then((aid)=>{ setadis(aid); });
        DeviceInfo.getBuildId().then((bid)=>{ setbdis(bid); })
    },[]);

    const login_ = (mail,num,uni_key)=>{
        console.log(mail);
        console.log(num);
        console.log(uni_key)
        fetch(`http://senderapp.xysales.com/got/${num}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mailid:mail,
                device_uni_key: uni_key,
            })
        }).then((response) => response.json())
        .then((responseJson) => {
            if(responseJson.status === "done"){
                navigation.navigate('OTPScreen',{m:mail,d:uni_key,n:num});
            }else{
                navigation.navigate("CommonErr",{id:"relogin",title:"Need To Re-login",msg:"something went wrong please relogin"})
            }
        });
    };
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
                <Text style={styles.logotxt1}>KhakiPost</Text>
                <Text style={styles.tagtxt1}>Write Schedule & send</Text>
                <TextInput style={[styles.txtdarl,styles.login_fields]} onChangeText={(mailid) => setemail(mailid)} value={email} placeholder={'Enter Registered email id'} placeholderTextColor={"black"} floatingPlaceholder validateOnChange enableErrors validate={['required', 'email']} validationMessage={['Field is required', 'Email is invalid',]}/>
                <TextInput style={[styles.txtdarl,styles.login_fields]} onChangeText={(number) => setpnum(number)} value={pnum} placeholder={'Enter Registered Phone number'} placeholderTextColor={"black"} floatingPlaceholder validateOnChange enableErrors validate={['required', (value) => value.length > 9]} validationMessage={['Field is required', 'Phone number is invalid',]} maxLength={14} />

                <View style={styles.vm1}>
                    <TouchableOpacity style={styles.btn1} onPress={()=> {login_(email,pnum,DeviceInfo.getDeviceId()+"_"+aids+"_"+bids)}}>
                        <Text style={styles.btntxt1}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

function OTPScreen({ route,navigation }){

    var [otp1,setotp1] = useState('');
    const {m,n,d} = route.params;
    const handler = (otp_)=>{
        fetch(`http://senderapp.xysales.com/otp/${n}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mailid:m,
                otp:otp_,
                device_uni_key: d,
            })
        }).then((response) => response.json())
        .then((responseJson) => {
            if(responseJson.status === "done"){
                AsyncStorage.setItem("isuser", JSON.stringify({uid:m,un:n,did:d})).then((g)=>{
                    navigation.navigate('HomeScreen');
                }).catch((e)=>{
                    pusherrorlog('RELOGIN_CATCH',e)
                    navigation.navigate("CommonErr",{id:"relogin",title:"Need To Re-login",msg:"something went wrong please relogin"})

                })
            }else{
                pusherrorlog('RELOGIN_ELSE',responseJson)
                navigation.navigate("CommonErr",{id:"relogin",title:"Need To Re-login",msg:"something went wrong please relogin"})

            }
        });
    };

    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
                <Text style={styles.logotxt1}>KhakiPost</Text>
                <Text style={styles.tagtxt1}>OTP send on Registered email id Check inbox </Text>
                <TextInput style={[styles.roundTextbox,styles.txtdarl]} onChangeText={(ot1) => setotp1(ot1)} value={otp1} placeholder={'OTP goes here'} placeholderTextColor={"black"}  maxLength={9}/>
                <View style={styles.vm1}>
                    <TouchableOpacity style={styles.btn1} onPress={()=> {handler(otp1)}}>
                        <Text style={styles.btntxt1}>Submit OTP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}



function HomeScreen({ navigation }){
    askReques()
    var [con,setcon] = useState();
    var [tbody,settbody] = useState('');
    var gtest = () =>{
        console.log(tbody.length)
    }
    useEffect(()=>{
        navigation.addListener('beforeRemove', (e) => {
           console.log(e)
           e.preventDefault();
        })
        getData('isbg').then((data)=>{
            if(!data){
                AsyncStorage.setItem("isbg", JSON.stringify({isbs:true})).then((g)=>{
                    startB()
                }).catch((e)=>{
                    pusherrorlog('ISBG_HOME_CATCH_SET',e)
                    console.log(e)
                })
            }else{
                if(data.isbs === true){
                    startB()
                }else if(data.isbs === false){
                    stopB()
                }
            }
        }).catch(e=>{
            console.log(e)
            pusherrorlog('ISBG_HOME_CATCH_GET',e)
        })
    },[]);
    const test_ = async ()=>{
        DeviceInfo.getPhoneNumber().then((phoneNumber) => {
            console.log(phoneNumber)
        });
    }
    callDetector = new CallDetectorManager((event, phoneNumber)=> {
        if (event === 'Disconnected') {
            iscompleted = 1;
            if(isincoming === 1){
                getData("exls").then((isexls)=>{
                    if(isexls.xls !== "undefined" || isexls.xls.length !== 0){
                        if(isexls.xls.includes(phoneNumber.split("+91")[1])){
                            console.log("if")
                            console.log(isexls.xls)
                            console.log(phoneNumber)
                            isincoming = 0;
                            iscompleted = 0;
                            isdailed = 0;
                        }else{
                            getData("incomingcalltemplate").then((ele)=>{
                                getData("isrepeat").then((ir)=>{
                                    if(ir.isrep){
                                        console.log(ir)
                                        if(ir.isrep === true){
                                            getData('isrepeated').then((isrptd)=>{
                                                if(isrptd.rpls){
                                                    if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                        console.log("i",isrptd.rpls)
                                                    }else{
                                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                            if(smsRes === "MS"){

                                                            }else{

                                                            }
                                                        });
                                                        var newlis =  isrptd.rpls
                                                        console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                        AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                            console.log("ie",isrptd.rpls)
                                                        }).catch((e)=>{
                                                            pusherrorlog('ISREPEATED_HOME_CATCH_SET',e)
                                                            return "error"
                                                        })
                                                    }
                                                }else{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                        console.log("ie",isrptd.rpls)
                                                    }).catch((e)=>{
                                                        pusherrorlog('ISREPEATED_HOME_CATCH_SET_ELSE',e)
                                                        return "error"
                                                    })
                                                }
                                            }).catch(isr=>{
                                                pusherrorlog('ISREPEATED_HOME_CATCH_SET_ISR',isr)
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    console.log("ise",isrptd.rpls)
                                                }).catch((e)=>{
                                                    pusherrorlog('ISREPEATED_HOME_CATCH_SET_CATCH_GET',e)
                                                    return "error"
                                                })
                                            })
                                        }else{
                                            console.log("dn")
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });

                                        }
                                    }else{
                                        console.log("doness")
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });

                                    }

                                }).catch(e=>{
                                    console.log("missed",e)
                                    pusherrorlog('ISREPEATED_HOME_CATCH_GET',e)
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });
                                });
                                // DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl);
                                isincoming = 0;
                                iscompleted = 0;
                                isdailed = 0;
                            }).catch((e)=>{
                                pusherrorlog('INCOMINGCALLTEMPLATE_HOME_CATCH_GET',e)
                                console.log(e)
                            })
                        }
                    }else{
                        getData("incomingcalltemplate").then((ele)=>{
                            getData("isrepeat").then((ir)=>{
                                if(ir.isrep){
                                    console.log(ir)
                                    if(ir.isrep === true){
                                        getData('isrepeated').then((isrptd)=>{
                                            if(isrptd.rpls){
                                                if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                    console.log("i",isrptd.rpls)
                                                }else{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    var newlis =  isrptd.rpls
                                                    console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                    AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                        console.log("ie",isrptd.rpls)
                                                    }).catch((e)=>{
                                                        pusherrorlog('ISREPEATED_HOME_CATCH_SET_ELSE',e)
                                                        return "error"
                                                    })
                                                }
                                            }else{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                    console.log("ie",isrptd.rpls)
                                                }).catch((e)=>{
                                                    pusherrorlog('ISREPEATED_HOME_CATCH_SET_E_ELSE',e)

                                                    return "error"
                                                })
                                            }
                                        }).catch(isr=>{
                                            pusherrorlog('ISREPEATED_HOME_CATCH_GET_ELSE',isr)

                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                console.log("ise",isrptd.rpls)
                                            }).catch((e)=>{
                                                pusherrorlog('ISREPEATED_HOME_CATCH_SET_ELSE_CATCH',e)
                                                return "error"
                                            })
                                        })
                                    }else{
                                        console.log("dn")
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });

                                    }
                                }else{
                                    console.log("doness")
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });

                                }

                            }).catch(e=>{
                                console.log("missed",e)
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                    if(smsRes === "MS"){

                                    }else{

                                    }
                                });
                            });
                            // DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl);
                            isincoming = 0;
                            iscompleted = 0;
                            isdailed = 0;
                        }).catch((e)=>{
                            pusherrorlog('INCOMINGCALLTEMPLATE_HOME_CATCH_GET_ELSE',e)
                            console.log(e)
                        })
                    }
                }).catch(e=>{
                    pusherrorlog('EXLS_HOME_CATCH_GET',e)
                    getData("incomingcalltemplate").then((ele)=>{
                        getData("isrepeat").then((ir)=>{
                            if(ir.isrep){
                                console.log(ir)
                                if(ir.isrep === true){
                                    getData('isrepeated').then((isrptd)=>{
                                        if(isrptd.rpls){
                                            if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                console.log("i",isrptd.rpls)
                                            }else{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                var newlis =  isrptd.rpls
                                                console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                    console.log("ie",isrptd.rpls)
                                                }).catch((e)=>{
                                                    pusherrorlog('EXLS_HOME_CATCH_ISREP_SET',e)
                                                    return "error"
                                                })
                                            }
                                        }else{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                console.log("ie",isrptd.rpls)
                                            }).catch((e)=>{
                                                pusherrorlog('EXLS_HOME_CATCH_ISREP_SET',e)
                                                return "error"
                                            })
                                        }
                                    }).catch(isr=>{
                                        pusherrorlog('EXLS_HOME_CATCH_ISREP_GET',isr)
                                        AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            console.log("ise",isrptd.rpls)
                                        }).catch((e)=>{
                                            pusherrorlog('EXLS_HOME_CATCH_ISREP_GET_SET_CATCH',e)
                                            return "error"
                                        })
                                    })
                                }else{
                                    console.log("dn")
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });

                                }
                            }else{
                                console.log("doness")
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                    if(smsRes === "MS"){

                                    }else{

                                    }
                                });

                            }

                        }).catch(e=>{
                            console.log("missed",e)
                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl,(smsRes)=>{
                                if(smsRes === "MS"){

                                }else{

                                }
                            });
                        });
                        // DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.icl);
                        isincoming = 0;
                        iscompleted = 0;
                        isdailed = 0;
                    }).catch((e)=>{
                        pusherrorlog('EXLS_HOME_CATCH_INCOMINGCALLTEMPLATE_GET',e)

                        console.log(e)
                    })
                })
            }else if(isdailed === 1){
                getData("exls").then((isexls)=>{
                    if(isexls.xls !== "undefined" || isexls.xls.length !== 0){
                        if(isexls.xls.includes(phoneNumber.split("+91")[1])){
                            console.log("if")
                            console.log(isexls.xls)
                            console.log(phoneNumber)
                            isincoming = 0;
                            iscompleted = 0;
                            isdailed = 0;

                        }else{
                            getData("outgoingcalltemplate").then((ele)=>{
                                console.log(ele)
                                getData("isrepeat").then((ir)=>{
                                    if(ir.isrep){
                                        if(ir.isrep === true){
                                            getData('isrepeated').then((isrptd)=>{
                                                if(isrptd.rpls){
                                                    if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                        console.log("i",isrptd.rpls)
                                                    }else{
                                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                            if(smsRes === "MS"){

                                                            }else{

                                                            }
                                                        });
                                                        var newlis =  isrptd.rpls
                                                        console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                        AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{

                                                            console.log("ie",isrptd.rpls)
                                                        }).catch((e)=>{
                                                            pusherrorlog('EXLS_OUTGOING_HOME_CATCH_ISREP_SET',e)

                                                            return "error"
                                                        })
                                                    }
                                                }else{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                        console.log("ie",isrptd.rpls)
                                                    }).catch((e)=>{
                                                        return "error"
                                                    })
                                                }
                                            }).catch(isr=>{
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    console.log("ise",isrptd.rpls)
                                                }).catch((e)=>{
                                                    return "error"
                                                })
                                            })
                                        }else{
                                            console.log("dn")
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                        }
                                    }else{
                                        console.log("doness")
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });
                                    }

                                }).catch(e=>{
                                    console.log("missed",e)
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });
                                });

                                isincoming = 0;
                                iscompleted = 0;
                                isdailed = 0;
                                console.log("i am outgoing")
                            }).catch((e)=>{
                                console.log(e)
                            })
                        }
                    }else{
                        getData("outgoingcalltemplate").then((ele)=>{
                            console.log(ele)
                            getData("isrepeat").then((ir)=>{
                                if(ir.isrep){
                                    if(ir.isrep === true){
                                        getData('isrepeated').then((isrptd)=>{
                                            if(isrptd.rpls){
                                                if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                    console.log("i",isrptd.rpls)
                                                }else{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    var newlis =  isrptd.rpls
                                                    console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                    AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                        console.log("ie",isrptd.rpls)
                                                    }).catch((e)=>{
                                                        return "error"
                                                    })
                                                }
                                            }else{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                    console.log("ie",isrptd.rpls)
                                                }).catch((e)=>{
                                                    return "error"
                                                })
                                            }
                                        }).catch(isr=>{
                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                console.log("ise",isrptd.rpls)
                                            }).catch((e)=>{
                                                return "error"
                                            })
                                        })
                                    }else{
                                        console.log("dn")
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });
                                    }
                                }else{
                                    console.log("doness")
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });
                                }

                            }).catch(e=>{
                                console.log("missed",e)
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                    if(smsRes === "MS"){

                                    }else{

                                    }
                                });
                            });

                            isincoming = 0;
                            iscompleted = 0;
                            isdailed = 0;
                            console.log("i am outgoing")
                        }).catch((e)=>{
                            console.log(e)
                        })
                    }
                }).catch(ex=>{
                    getData("outgoingcalltemplate").then((ele)=>{
                        console.log(ele)
                        getData("isrepeat").then((ir)=>{
                            if(ir.isrep){
                                if(ir.isrep === true){
                                    getData('isrepeated').then((isrptd)=>{
                                        if(isrptd.rpls){
                                            if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                console.log("i",isrptd.rpls)
                                            }else{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                var newlis =  isrptd.rpls
                                                console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                    console.log("ie",isrptd.rpls)
                                                }).catch((e)=>{
                                                    return "error"
                                                })
                                            }
                                        }else{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                console.log("ie",isrptd.rpls)
                                            }).catch((e)=>{
                                                return "error"
                                            })
                                        }
                                    }).catch(isr=>{
                                        AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            console.log("ise",isrptd.rpls)
                                        }).catch((e)=>{
                                            return "error"
                                        })
                                    })
                                }else{
                                    console.log("dn")
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });
                                }
                            }else{
                                console.log("doness")
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                    if(smsRes === "MS"){

                                    }else{

                                    }
                                });
                            }

                        }).catch(e=>{
                            console.log("missed",e)
                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber, ele.ocl,(smsRes)=>{
                                if(smsRes === "MS"){

                                }else{

                                }
                            });
                        });

                        isincoming = 0;
                        iscompleted = 0;
                        isdailed = 0;
                        console.log("i am outgoing")
                    }).catch((e)=>{
                        console.log(e)
                    })
                })
            }else{

            }
        }else if (event === 'Connected') {
            console.log("----------------------------------------")
            console.log("call connected")
            console.log(event)
            console.log("----------------------------------------")
        }else if (event === 'Incoming') {
            isincoming = 1;
            console.log("----------------------------------------")
            console.log(phoneNumber)
            console.log("jack",event)
            console.log("----------------------------------------")
        }else if (event === 'Dialing') {
            isdailed = 1;
            console.log("----------------------------------------")
            console.log(phoneNumber)
            console.log("sd",event)
            console.log("----------------------------------------")
        }else if (event === 'Offhook') {
            console.log("offhoook, ",event)
            if(isincoming === 1){
                console.log("----------------------------------------")
                console.log(event)
                console.log("----------------------------------------")
            }else{
                isdailed = 1;
            }
        }
        else if (event === 'Missed') {
            getData("exls").then((isexls)=>{
                if(isexls.xls !== "undefined" || isexls.xls.length !== 0){
                    if(isexls.xls.includes(phoneNumber.split("+91")[1])){
                        console.log("if")
                        console.log(isexls.xls)
                        console.log(phoneNumber)
                    }else{
                        console.log("else")
                        console.log(isexls.xls)
                        console.log(phoneNumber.split("+91")[1])
                        getData("missedcalltemplate").then((ele)=>{
                            var msg = ele.mcl.trimStart()
                            getData("isrepeat").then((ir)=>{
                                console.log(ir)
                                if(ir.isrep){
                                    if(ir.isrep === true){
                                        getData('isrepeated').then((isrptd)=>{
                                            if(isrptd.rpls){
                                                if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                    console.log("i",isrptd.rpls)
                                                }else{
                                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                        if(smsRes === "MS"){

                                                        }else{

                                                        }
                                                    });
                                                    var newlis =  isrptd.rpls
                                                    console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                    AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                        console.log("ie",isrptd.rpls)
                                                    }).catch((e)=>{
                                                        return "error"
                                                    })
                                                }
                                            }else{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                    console.log("ie",isrptd.rpls)
                                                }).catch((e)=>{
                                                    return "error"
                                                })
                                            }
                                        }).catch(isr=>{
                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                console.log("ise",isrptd.rpls)
                                            }).catch((e)=>{
                                                return "error"
                                            })
                                        })
                                    }else{
                                        console.log("dn")
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });
                                        isreeep.push(phoneNumber)
                                    }
                                }else{
                                    console.log("doness")
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    });
                                }

                            }).catch(e=>{
                                console.log("missed",e)
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl);
                            });
                        }).catch((e)=>{
                            console.log(e)
                        })
                    }
                }else{
                    getData("missedcalltemplate").then((ele)=>{
                        var msg = ele.mcl.trimStart()
                        getData("isrepeat").then((ir)=>{
                            console.log()
                            if(ir.isrep){
                                if(ir.isrep === true){
                                    getData('isrepeated').then((isrptd)=>{
                                        if(isrptd.rpls){
                                            if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                                console.log("i",isrptd.rpls)
                                            }else{
                                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                    if(smsRes === "MS"){

                                                    }else{

                                                    }
                                                });
                                                var newlis =  isrptd.rpls
                                                console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                                AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                    console.log("ie",isrptd.rpls)
                                                }).catch((e)=>{
                                                    return "error"
                                                })
                                            }
                                        }else{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                                console.log("ie",isrptd.rpls)
                                            }).catch((e)=>{
                                                return "error"
                                            })
                                        }
                                    }).catch(isr=>{
                                        AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            console.log("ise",isrptd.rpls)
                                        }).catch((e)=>{
                                            return "error"
                                        })
                                    })
                                }else{
                                    console.log("dn")
                                    DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                        if(smsRes === "MS"){

                                        }else{

                                        }
                                    }   );
                                    isreeep.push(phoneNumber)
                                }
                            }else{
                                console.log("doness")
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                    if(smsRes === "MS"){

                                    }else{

                                    }
                                });
                            }

                        }).catch(e=>{
                            console.log("missed",e)
                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                if(smsRes === "MS"){

                                }else{

                                }
                            });
                        });
                    }).catch((e)=>{
                        console.log(e)
                    })
                }
            }).catch(ex=>{
                getData("missedcalltemplate").then((ele)=>{
                    var msg = ele.mcl.trimStart()
                    getData("isrepeat").then((ir)=>{
                        console.log()
                        if(ir.isrep){
                            if(ir.isrep === true){
                                getData('isrepeated').then((isrptd)=>{
                                    if(isrptd.rpls){
                                        if(isrptd.rpls.includes(phoneNumber+"_"+new Date().toISOString().split("T")[0])){
                                            console.log("i",isrptd.rpls)
                                        }else{
                                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                                if(smsRes === "MS"){

                                                }else{

                                                }
                                            });
                                            var newlis =  isrptd.rpls
                                            console.log(newlis.push(phoneNumber+"_"+new Date().toISOString().split("T")[0]))
                                            AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:newlis})).then((g)=>{
                                                console.log("ie",isrptd.rpls)
                                            }).catch((e)=>{
                                                return "error"
                                            })
                                        }
                                    }else{
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });
                                        AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                            console.log("ie",isrptd.rpls)
                                        }).catch((e)=>{
                                            return "error"
                                        })
                                    }
                                }).catch(isr=>{
                                    AsyncStorage.setItem("isrepeated", JSON.stringify({rpls:[phoneNumber+"_"+new Date().toISOString().split("T")[0]]})).then((g)=>{
                                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                            if(smsRes === "MS"){

                                            }else{

                                            }
                                        });
                                        console.log("ise",isrptd.rpls)
                                    }).catch((e)=>{
                                        return "error"
                                    })
                                })
                            }else{
                                console.log("dn")
                                DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                    if(smsRes === "MS"){

                                    }else{

                                    }
                                });
                                isreeep.push(phoneNumber)
                            }
                        }else{
                            console.log("doness")
                            DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                                if(smsRes === "MS"){

                                }else{

                                }
                            });
                        }

                    }).catch(e=>{
                        console.log("missed",e)
                        DirectWhatsapp.sendDirectWhatsapp(phoneNumber,ele.mcl,(smsRes)=>{
                            if(smsRes === "MS"){

                            }else{

                            }
                        });
                    });
                }).catch((e)=>{
                    fetch(`http://senderapp.xysales.com/report/`, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            um:data.uid,
                            un: data.un,
                            tempname:tname,
                            tempbody:tbody.replace(/'/g, "#_"),
                        })
                    }).then((response) => response.json())
                    .then((responseJson) => {
                        if(responseJson.status === "submited"){
                            console.log(e)
                        }else{
                            console.log(e)
                        }
                    });
                })
            })
        }
    },true,
    ()=>{},
        {
            title: 'Phone State Permission',
            message: 'This app needs access to your phone state in order to react and/or to adapt to incoming calls.'
        }
    )
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.mainbodycontainer}>
                <Text style={styles.logotxt3}>KhakiPost <Text style={styles.tagtxt3}>V {version}</Text></Text>
                <Text style={styles.tagtxt1}>The Best Marketing App You Need To GROW Your Business</Text>
                <View style={styles.row}>
                    <TouchableOpacity style={styles.hm1} onPress={() => navigation.navigate('Templates')}>
                        <View style={styles.btnicon1}>
                            <FontAwesomeIcon icon={ faCommentSms } size={ 32 } />
                        </View>
                        <Text style={[styles.txtdarl,styles.textcenter]}>Campaign</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hm1} onPress={()=> navigation.navigate('Set Auto-Reply')}>
                        <View style={styles.btnicon1}>
                            <FontAwesomeIcon icon={ faReply } size={ 32 } />
                        </View>
                        <Text style={[styles.txtdarl,styles.textcenter]}>Auto Reply</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.row}>
                    <TouchableOpacity style={styles.hm1} onPress={() => navigation.navigate('Sendfromload')}>
                        <View style={styles.btnicon1}>
                            <FontAwesomeIcon icon={ faUpload } size={ 32 } />
                        </View>
                        <Text style={[styles.txtdarl,styles.textcenter]}>Custom Campaign</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.hm1} onPress={() => navigation.navigate('General Setting')}>
                        <View style={styles.btnicon1}>
                            <FontAwesomeIcon icon={ faCogs } size={ 32 } />
                        </View>
                        <Text style={[styles.txtdarl,styles.textcenter]}>Setting</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.txtdarl]}>Support:</Text>
                <TouchableOpacity onPress={() => Linking.openURL('tel://+91-8422003305')}>
                    <Text style={[styles.txtdarl]}>+91-8422003305</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('mailto://khakipostteam@gmail.com')}>
                    <Text style={[styles.txtdarl]}>khakipostteam@gmail.com</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}




function LoadingScreen({ route,navigation }){
    var {title,message,page} = route.params;
    useEffect(()=>{
        setTimeout(function(){
            if(page === "Template"){
                navigation.navigate('Templates')
            }
        }, 3000)
    },[]);
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
                <Text style={styles.logotxt1}>{title}</Text>
                <Text style={styles.logotxt1}>{message}</Text>
                <ActivityIndicator />
            </View>
        </SafeAreaView>
    );
}



function CreateTemplates({ navigation }){
    var [tname,settname] = useState('');
    var [tbody,settbody] = useState('');
    console.log("=========================================")
    console.log(md5(tbody))
    console.log("=========================================")
    const setTemplate = ()=>{
        getData("isuser").then((data)=>{
            fetch(`http://senderapp.xysales.com/template/set/${data.did}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    um:data.uid,
                    un: data.un,
                    tempname:tname,
                    tempbody:tbody.replace(/'/g, "#_"),
                })
            }).then((response) => response.json())
            .then((responseJson) => {
                if(responseJson.status === "spass"){
                    console.log(data)
                    console.log(responseJson)
                    navigation.navigate('LoadingScreen',{title:"Adding New Template",message:"...",page:"Template"});
                }else{
                    console.log(responseJson)
                    // navigation.navigate('FaildScreen',{});
                }
            });
        })
    };
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.p1}>
                <TextInput style={styles.login_fields} onChangeText={(tn) => settname(tn)} value={tname} placeholder={'Enter Template Name'}  placeholderTextColor={"black"} floatingPlaceholder validateOnChange enableErrors validate={['required']} validationMessage={['Field is required']} showCharCounter maxLength={30}/>
                <View style={styles.p1}>
                    <TextInput style={[styles.txtdarl,styles.roundTextbox]} numberOfLines={7} multiline={true} maxLength={160} placeholder={'Enter messages'}  placeholderTextColor={"black"} floatingPlaceholder onChangeText={(tb) => settbody(tb)} value={tbody} />
                </View>
                <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=>setTemplate()}>
                    <Text style={styles.btntxt1}>Create Template</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>

    );
}


function ViewTemplates({ route,navigation }){
    const {tname,tbody,tdate} = route.params;
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View>
                <Text style={styles.TemplateViewHeading} >{tname}</Text>
                <Text style={styles.TemplateViewdate} >{tdate}</Text>
                <View style={styles.p1}>
                    <Text style={styles.TemplateViewBody} >{tbody}</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

function Startmessage({ route , navigation }){
    var {msgid,whis,msg} = route.params;
    const [sentx,setsentx] = useState();
    const [sentlog,setsentlog] = useState('');
    var jck = 0;
    const stopcampaign = () =>{
        isCampaign = 0
        isCampgo = false
        camcount = 0
    }

    useEffect(()=>{
        // fetch(`http://senderapp.xysales.com/transport/getall`, {
        //     method: 'POST',
        //     headers: {
        //         Accept: 'application/json',
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         msid:msgid,
        //         whois:whis,
        //     })
        // }).then((response) => response.json()).then((resJson)=>{
        //     campdata = resJson.data

        //     console.log('as resJson len ',resJson)
        //     isCampaign = 1
        // }).catch((e)=>{
        //     console.log(e)
        //     pusherrorlog('STARTMESSAGE_ERR',e)

        // })
        campdata = syncconls
        isCampaign = 1
        cmsgtext = msg
        cmsgid = msgid
        var updateloop = setInterval(()=>{
            setsentx(camcount)
            setsentlog(entry)
            if(camcount === campdata.length || isCampaign === 0) clearInterval(updateloop);
        }, 2000);
        return () =>{
            console.log("clear")
            clearInterval(updateloop)
        }
    },[]);
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View>
            <TouchableOpacity style={styles.btn1} onPress={()=>{stopcampaign()}}>
                <Text>Stop</Text>
            </TouchableOpacity>
            <Text style={[styles.txtdarl]}>Sending SMS {camcount}/100</Text>
            <ScrollView>
                <Text style={[styles.txtdarl]}>{sentlog}</Text>
            </ScrollView>
            </View>
        </SafeAreaView>
    );
}

function Templateoption({ route ,navigation }){
    var {msgtxt,msid,whois} = route.params;
    const tt = () =>{
        syncconls.forEach((ds)=>{
            console.log(ds)
        })
        console.log(campdata.length)
        // console.log(syncconls)
        // console.log(syncconls.length)
    }
    useEffect(()=>{
        fetch(`http://senderapp.xysales.com/transport/getmeta`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tid:msid,
                whis:whois,
            })
        }).then((response) => response.json()).then((resJson)=>{
            if(resJson.status === "meta_not_found"){
                // fetch(`http://senderapp.xysales.com/transport/setmeta`, {
                //     method: 'POST',
                //     headers: {
                //         Accept: 'application/json',
                //         'Content-Type': 'application/json'
                //     },
                //     body: JSON.stringify({
                //         tid:msid,
                //         whis:whois,
                //     })
                // }).then((response) => response.json()).then((resJson)=>{
                //     if(resJson.status === "meta_ADDED"){
                //         Contacts.getAll().then((contacts)=>{
                //             var sorted_con = contacts.sort((a,b)=>a.displayName.localeCompare(b.displayName));

                //             const intv = setInterval(gen => {
                //                 const n = gen.next()
                //                 if (n.done) return clearInterval(intv)
                //                         if(typeof n.value.phoneNumbers[0] === 'undefined' || n.value.phoneNumbers.length === 0 || typeof n.value === 'undefined'){
                //                         }else{
                //                             if(n.value.phoneNumbers[0].number.length >= 10){
                //                                 fetch(`http://senderapp.xysales.com/transport/load`, {
                //                                     method: 'POST',
                //                                     headers: {
                //                                         Accept: 'application/json',
                //                                         'Content-Type': 'application/json'
                //                                     },
                //                                     body: JSON.stringify({
                //                                         msg:msgtxt,
                //                                         con:n.value.phoneNumbers[0].number,
                //                                         msgid:msid,
                //                                         whis:whois,
                //                                     })
                //                                 }).then((response) => response.json()).then((resJson)=>{

                //                                 }).catch((e)=>{
                //                                     console.log('so_error',e)
                //                                 })
                //                             }else{
                //                                 console.log("jese",n.value.displayName+"_"+n.value.phoneNumbers[0].number)
                //                             }
                //                         }
                //             },250, sorted_con[Symbol.iterator]())
                //         }).catch((ce)=>{
                //             pusherrorlog('con_read_failed',ce)
                //         })
                //     }else if(resJson.status === "meta_ADD_FAILED"){
                //         console.log("add_failed",resJson)
                //     }
                // }).catch((e)=>{
                //     console.log(e)
                // })
            }else if(resJson.status === "meta_found"){
                console.log(resJson)
            }
            console.log(resJson)
        }).catch((e)=>{
            console.log(e)
        })
    },[]);
    return (
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.homebodycontainer}>
                <TouchableOpacity style={styles.btn1} onPress={()=>navigation.navigate('Startmessage',{msg:msgtxt,msgid:msid,whis:whois})}>
                    <Text>All</Text>
                </TouchableOpacity>
                <Text>or</Text>
                <TouchableOpacity style={styles.btn1} onPress={()=>{tt()}}>
                    <Text>Kill</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}


function Templatelist({ list_of_template }){
    const navigation = useNavigation();
    const delTemp = (td,whis)=>{
        getData("isuser").then((data)=>{
            fetch(`http://senderapp.xysales.com/template/del/${data.did}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tid:td,
                    who:whis,
                })
            }).then((response) => response.json())
            .then((responseJson) => {
                if(responseJson.status === "gpass"){
                    navigation.navigate('LoadingScreen',{title:"Deleting Template",message:"...",page:"Template"});
                }else{
                    console.log(responseJson)
                }
            }).catch((e)=>{
                console.log(e)
            })
        }).catch((e)=>{
            console.log(e)
        })
    }
    return(
        <View style={[styles.row,styles.vm3]}>
            <TouchableOpacity style={[styles.w60]} onPress={() => navigation.navigate('ViewTemplates',{tname:list_of_template?.message_name,tbody:list_of_template?.message,tdate:list_of_template?.dateofcreation.split("T")[0]})}>
                <View>
                    <Text style={styles.tagtxt3} >{list_of_template.message_name}</Text>
                    <Text style={[styles.txtdarl]}>{list_of_template.dateofcreation.split("T")[0]}</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bgprimary,styles.mR1,styles.p1,styles.br1]} onPress={()=>navigation.navigate('TemplateOpt',{msgtxt:list_of_template?.message,msid:list_of_template?.templateid,whois:list_of_template?.whois})}>
                <View>
                    <Text style={[styles.btntxt1]} >Start</Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bgdanger,styles.p1,styles.br1]} onPress={()=>delTemp(list_of_template?.templateid,list_of_template?.whois)}>
                <View>
                    <Text style={[styles.btntxt1]}><FontAwesomeIcon icon={ faTrash } size={ 22 } /></Text>
                </View>
            </TouchableOpacity>

        </View>

    );
}

function Templates({ navigation }){
    var [listoftemplate,setlistoftemplate] = useState()
    var [lcheck,setlcheck] = useState()
    useFocusEffect(
        useCallback(()=>{
            getData("isuser").then((data)=>{
                // setTimeout(function(){
                    console.log(data.did)
                    fetch(`http://senderapp.xysales.com/template/get/${data.did}`, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            um:data.uid,
                            un: data.un,
                        })
                    }).then((response) => response.json())
                    .then((responseJson) => {
                        if(responseJson.status === "gpass"){
                            setlcheck(true)
                            setlistoftemplate(responseJson.response)
                        }else{
                            console.log(responseJson)
                        }
                    }).catch((e)=>{
                        console.log(e)
                    })
                // }, 3000)
            }).catch((e)=>{
                console.log(e)
            })
        },[])
    );
    return (
        <SafeAreaView style={styles.safebodycontainer}>
            <View>
                <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=> {navigation.navigate('CreateTemplates')}}>
                    <Text style={styles.btntxt1}>Add Template</Text>
                </TouchableOpacity>
                <View>
                    {lcheck === true ?
                        <FlatList
                            data={listoftemplate}
                            renderItem={({item}) => <Templatelist list_of_template={item} />}
                            keyExtractor={item => item.templateid}
                        /> : <ActivityIndicator /> }
                </View>
            </View>
        </SafeAreaView>
    );
}

function ConSelectWithFilter({ navigation }){
    var [Searchresult,setSearchresult] = useState([])
    var [Searchquery,setSearchquery] = useState()
    var [isAll,setisAll] = useState(false)
}


function Startmessagefile({ route , navigation }){
    var {msg,msgid,cls} = route.params;
    var [sendc,setsendc] = useState(0);
    var [totalc,settotalc] = useState(0);
    const [sentlog,setsentlog] = useState('');

    var failedtosynclist = [];
    var notvalidforsms = [];
    var jck = 0;
    useEffect(()=>{
        settotalc(cls.length);
        getData("isuser").then((data)=>{
            fetch(`http://senderapp.xysales.com/sendlog/get/`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tid:msgid,
                who:data.un,
            })
            }).then((response) => response.json()).then((resJson)=>{
                if(resJson.length === 0){
                    const intv = setInterval(gen => {
                        const n = gen.next()
                        if (n.done) return clearInterval(intv)
                        if(jck <= 100){
                            if(typeof n.value === 'undefined' || n.value.length === 0 ){
                                console.log("---------------if--------------")
                                console.log(n.value)
                                console.log("-----------------------------")
                                failedtosynclist.push(n.value);
                            }else{
                                console.log("--------------else---------------")
                                console.log(n.value)
                                console.log(n.value)
                                console.log("-----------------------------")
                                if(n.value.length >= 10){
                                    fetch(`http://senderapp.xysales.com/sendlog/set/`, {
                                        method: 'POST',
                                        headers: {
                                            Accept: 'application/json',
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            tid:msgid,
                                            con:n.value,
                                            uid:data.un,
                                        })
                                    }).then((response) => response.json()).then((resJson)=>{
                                        console.log(n.value,intv)
                                        jck +=1
                                        setsentlog(sentlog => sentlog+="message sent "+n.value+"\n");
                                        DirectWhatsapp.sendDirectWhatsapp(n.value, msg.replace(/#_/g,"'")).then(()=>{

                                        });
                                        setsendc(jck);
                                        }).catch((e)=>{
                                            console.log(e)
                                        })
                                }else{
                                    console.log(n.value)
                                    notvalidforsms.push(n.value);
                                }
                            }
                        }else{
                            clearInterval(intv)
                        }
                    },300, cls[Symbol.iterator]())
                }else{
                    var server_contact_list = resJson.data.map((val)=>val.contact_)
                    const intv = setInterval(gen => {
                        const n = gen.next()
                        if (n.done) return clearInterval(intv)
                        if(server_contact_list.includes(n.value)){
                            setsentlog(sentlog => sentlog+="Already there "+n.value+"\n");
                        }else{
                            if(jck <= 100){
                                if(typeof n.value === 'undefined' || n.value.length === 0 ){
                                    console.log("---------------if--------------")
                                    console.log(n.value)
                                    console.log("-----------------------------")
                                    failedtosynclist.push(n.value);
                                }else{
                                    console.log("--------------else---------------")
                                    console.log(n.value)
                                    console.log(n.value)
                                    console.log("-----------------------------")
                                    if(n.value.length >= 10){
                                        fetch(`http://senderapp.xysales.com/sendlog/set/`, {
                                            method: 'POST',
                                            headers: {
                                                Accept: 'application/json',
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                tid:msgid,
                                                con:n.value,
                                                uid:data.un,
                                            })
                                        }).then((response) => response.json()).then((resJson)=>{
                                            console.log(n.value,intv)
                                            jck +=1
                                            setsentlog(sentlog => sentlog+="message sent "+n.value+"\n");
                                            DirectWhatsapp.sendDirectWhatsapp(n.value, msg.replace(/#_/g,"'")).then(()=>{

                                            });
                                            setsendc(jck);
                                            }).catch((e)=>{
                                                console.log(e)
                                            })
                                    }else{
                                        console.log(n.value)
                                        notvalidforsms.push(n.value);   
                                    }
                                } 
                            }else{
                                clearInterval(intv) 
                            }
                        }
                    },300, cls[Symbol.iterator]())
                }
            }).catch((e)=>{
                console.log(e)
            })
        })        
    },[]);
    return(
        <SafeAreaView style={[styles.safebodycontainer]}>
            <View style={[styles.defualtbodycontainer,styles.txtdarl]}>
                <Text>Sending SMS {sendc}/100</Text>
                <Text>total number of contacts found in device {totalc}</Text>
                <Text>total number of invalid number in pool {notvalidforsms.length}</Text>
                <Text>total number of number failed to sync in pool {failedtosynclist.length}</Text>
                <ScrollView>
                    <Text>{sentlog}</Text>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}


function Sendfromload({ navigation }){
    var [listoftemplate,setlistoftemplate] = useState()
    var [currentValue,setcurrentValue] = useState()
    var [SelectTemplate,setSelectTemplate] = useState('Select Template')
    var [consls,setconls] = useState('')
    var [txtf,settxtf] = useState('')


    const prepare_load = () =>{
        var final_address = txtf.split(/[ ,\n]+/)  
        // console.log(final_address.concat(consls.split(/[ ,\n]+/)))
        var newlist  = listoftemplate.filter(element => element.templateid === currentValue[0]);
        navigation.navigate('Startmessagefile',{msg:newlist[0].message,msgid:newlist[0].templateid,cls:final_address.concat(consls.split(/[ ,\n]+/).filter(n => n))})
    }

    const handleError = (err) => {
        if (DocumentPicker.isCancel(err)) {
        //   console.warn('cancelled')
          // User cancelled the picker, exit any dialogs or menus and move on
        } else if (isInProgress(err)) {
          console.warn('multiple pickers were opened, only the last will be considered')
        } else {
          throw err
        }
    }

    const Pickfile = async ()=>{
        try{
            const response = await DocumentPicker.pick({
                presentationStyle: 'fullScreen',
                type: [types.allFiles],
            });
            console.log(response)
            if(response[0].name.split(".")[1] === 'xlsx'){
                console.log("file://"+response[0].uri.split("://")[1])
                
            }else{
                RNFS.readFile(response[0].uri).then((file) => {
                const csv_list = file.split(/[ ,\n]+/) 
                    csv_list.forEach((ele)=>{
                        if(ele.match(/^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/)) {
                            console.log("if ",ele)
                            setconls(conls => conls+=ele+"\n");
                        }else {
                            console.log("else: ",ele)
                        }
                    })
                }).catch((error) => console.log('err: ' + error));
            }
            
        }catch(e){
            handleError(e)
        }
    }
    useEffect(()=>{
        getData("isuser").then((data)=>{
            fetch(`http://senderapp.xysales.com/template/get/${data.did}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    um:data.uid,
                    un: data.un,
                })
            }).then((response) => response.json())
            .then((responseJson) => {
                if(responseJson.status === "gpass"){
                    setlistoftemplate(responseJson.response)
                }else{
                    console.log(responseJson)
                }
            }).catch((e)=>{
                console.log(e)
            })
        }).catch((e)=>{
            console.log(e)
        })
    },[]);
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <Text style={styles.logotxt3}>KhakiPost <Text style={styles.tagtxt3}>V {version}</Text></Text>
            <View style={styles.defualtbodycontainer}>
                {listoftemplate ? 
                    <MultiSelect
                    searchIcon
                    items={listoftemplate}
                    uniqueKey="templateid"
                    onSelectedItemsChange={e=>{
                        setcurrentValue(e)
                        setSelectTemplate(e)
                        console.log(e)
                    }}
                    selectedItems={currentValue}
                    selectText="Pick Template"
                    searchInputPlaceholderText="Search Template..."
                    onChangeInput={ (text)=> console.log(text)}
                    displayKey="message_name"
                    searchInputStyle={{ color: '#CCC' }}
                    submitButtonColor="#CCC"
                    submitButtonText="Submit"
                />
                : null }
                <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=> {Pickfile()}}>
                    <Text style={styles.btntxt1}>Upload File</Text>
                </TouchableOpacity> 
                <ScrollView>
                    <Text>{consls}</Text>
                </ScrollView>
                <TextInput style={styles.login_fields} onChangeText={(tn) =>settxtf(tn)} value={txtf} placeholder={'Enter Contacts manually seprated by ,'} floatingPlaceholder validateOnChange enableErrors validate={['required']} validationMessage={['Field is required']}/>
                <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=> {prepare_load()}}>
                    <Text style={styles.btntxt1}>Start Campaign</Text>
                </TouchableOpacity> 
            </View>  
        </SafeAreaView>
    );
}




function SetQuickResponse({ navigation }){

    var [misssms,setmisssms] = useState('')
    var [incomingsms,setincomingsms] = useState('')
    var [outgoing,setoutgoing] = useState('')
    var [outgbmiss,setoutgbmiss] = useState('')
    

    const set_load = () =>{
        storeData("missedcalltemplate",{mcl:misssms}).then((res)=>{
            if(res === "done"){
                fetch(`http://senderapp.xysales.com/setauotres`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        udid:g_did,
                        uwhois:g_whois,
                        umctem:misssms,
                        temptype:'mc',
                    })
                }).then((response) => response.json())
                .then((responseJson) => {
                   console.log(responseJson)
                }).catch((e)=>{
                    //hm.pusherrorlog('SET_AUTORES_MISSCALL',e)
                })
            }else{
                console.log("cose",res)    
            }
        }).catch((e)=>{
            console.log(e)
        })  
        storeData("incomingcalltemplate",{icl:incomingsms}).then((res)=>{
            if(res === "done"){
                fetch(`http://senderapp.xysales.com/setauotres`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        udid:g_did,
                        uwhois:g_whois,
                        umctem:incomingsms,
                        temptype:'RC',
                    })
                }).then((response) => response.json())
                .then((responseJson) => {
                   
                }).catch((e)=>{
                    //hm.pusherrorlog('SET_AUTORES_RCCALL',e)
                })
            }else{
                console.log(res)    
            }
        }).catch((e)=>{
            console.log(e)
        })
        storeData("outgoingcalltemplate",{ocl:outgoing}).then((res)=>{
            if(res === "done"){
                fetch(`http://senderapp.xysales.com/setauotres`, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        udid:g_did,
                        uwhois:g_whois,
                        umctem:outgoing,
                        temptype:'oc',
                    })
                }).then((response) => response.json())
                .then((responseJson) => {
                   
                }).catch((e)=>{
                    //hm.pusherrorlog('SET_AUTORES_OCCALL',e)
                })
            }else{
                console.log(res)    
            }
        }).catch((e)=>{
            console.log(e)
        })
    }
    useEffect(()=>{
        getData("isuser").then((data)=>{
            getData("missedcalltemplate").then((ele)=>{    
                if (ele.mcl !== undefined){
                    setmisssms(ele.mcl)
                }else{

                }
            }).catch((e)=>{
                console.log(e)
            })
            getData("incomingcalltemplate").then((ele)=>{
                if (ele.icl !== undefined){
                    setincomingsms(ele.icl)
                }else{

                }
            }).catch((e)=>{
                console.log(e)
            })
            getData("outgoingcalltemplate").then((ele)=>{
                if (ele.ocl !== undefined){
                    setoutgoing(ele.ocl)
                }else{

                }
            }).catch((e)=>{
                console.log(e)
            })
        
        }).catch((e)=>{
            console.log(e)
        })
    },[]);
    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View style={styles.defualtbodycontainer}>
                <ScrollView>
                    <Text style={[styles.txtdarl,styles.p1,styles.fb]}>Response After Unpicked Calls or Missed Calls</Text>
                    <TextInput style={[styles.roundTextbox,styles.txtdarl]} numberOfLines={7} multiline={true} maxLength={160} onChangeText={(msms) =>setmisssms(msms)} value={misssms} placeholder={'Miscall or call Denied'} placeholderTextColor={'black'} showCharCounter/>
                    <Text style={[styles.txtdarl,styles.p1,styles.fb]}>Response After Incoming Calls Received</Text>
                    <TextInput style={[styles.roundTextbox,styles.txtdarl]} numberOfLines={7} multiline={true} maxLength={160} onChangeText={(isms) =>setincomingsms(isms)} value={incomingsms} placeholder={'Incoming Call Received'} placeholderTextColor={'black'} showCharCounter/>
                    <Text style={[styles.txtdarl,styles.p1,styles.fb]}>Response After Outgoing Dialled Calls</Text>
                    <TextInput style={[styles.roundTextbox,styles.txtdarl]} numberOfLines={7} multiline={true} maxLength={160} onChangeText={(osms) =>setoutgoing(osms)} value={outgoing} placeholder={'Outgoing call'} placeholderTextColor={'black'} showCharCounter/>        
                    <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=> {set_load()}}>
                        <Text style={styles.btntxt1}>Save SMS</Text>
                    </TouchableOpacity> 
                </ScrollView>
            </View>
        </SafeAreaView>  
    );
}

function Settings({ navigation }){
    
    var [isrepeat,setisrepeat] = useState(true)
    var [isbgs,setisbgs] = useState(true)
    var [conls,setconls] = useState()
    var [excludelist,setexcludelist] = useState()   
    var [councount,setconcount] = useState()
    var [xtext,setxtext] = useState('')
    var[smslimit,setsmslimit] = useState()
    var[mclimit,setmclimit] = useState()
    var[arlimit,setarlimit] = useState()
    
    var[blocklist,setblocklist] = useState([])
    const updatebg__ = async (para) =>{
        setisbgs(para)
        if(para === true){
            if(BackgroundService.isRunning() === true){

            }else{
                AsyncStorage.setItem("isbg", JSON.stringify({isbs:true})).then((g)=>{
                    startB()
                }).catch((e)=>{
                    console.log(e)
                })
            }
        }else if(para === false){
            if(BackgroundService.isRunning() === false){

            }else{
                await AsyncStorage.setItem("isbg", JSON.stringify({isbs:false})).then((g)=>{
                    stopB()
                }).catch((e)=>{
                    console.log(e)
                })
            }
        }
    }
    const noreap__ = async (para) =>{
        setisrepeat(para)
        if(para === true){
            AsyncStorage.setItem("isrepeat", JSON.stringify({isrep:true})).then((g)=>{
                            
            }).catch((e)=>{
              return "error"
            })
        }else if(para === false){
            AsyncStorage.setItem("isrepeat", JSON.stringify({isrep:false})).then((g)=>{
                            
            }).catch((e)=>{
              return "error"
            })
        }
    }
    useEffect(()=>{
        getData("isuser").then((data)=>{
            getData("isbg").then((isbg)=>{
                if(isbg.isbs === true || isbg.isbs === false){
                    setisbgs(isbg.isbs)
                }
            }).catch((e)=>{
                console.log(e)
            })
            getData("isrepeat").then((isrp)=>{
                if(isrp.isrep === true || isrp.isrep === false){
                    setisrepeat(isrp.isrep)
                }
            }).catch((e)=>{
                console.log(e)
            })
        }).catch((e)=>{
            console.log(e)
        })
    },[]);

    return(
        <SafeAreaView style={styles.safebodycontainer}>
            <View>
                <Text style={styles.logotxt3}>KhakiPost <Text style={styles.tagtxt3}>V {version}</Text></Text>
                <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=>{navigation.navigate('Block')}}> 
                    <Text style={styles.btntxt1}>Block Contacts</Text>
                </TouchableOpacity>
                {/* <Text>Set sms limit (Defualt 100 daily)</Text>
                <TextField style={styles.roundTextbox} maxLength={3} onChangeText={(msms) =>setsmslimit(msms)} value={smslimit} placeholder={'Leave empty for default'}/>
                <Text>Set Marketing Campaign limit (Defualt settings)</Text>
                <TextField style={styles.roundTextbox} maxLength={3} onChangeText={(msms) =>setmclimit(msms)} value={mclimit} placeholder={'Leave empty for default'} />
                <Text>Set auto-reply limit (Defualt settings)</Text>
                <TextField marginB-20 style={styles.roundTextbox} maxLength={3} onChangeText={(msms) =>setarlimit(msms)} value={arlimit} placeholder={'Leave empty for default'} />
                 */}
                <View style={styles.vh1}>
                    <View style={styles.row}>
                        <Text style={[styles.txtdarl]}>Background Running default on: </Text>
                        <Switch value={isbgs} onValueChange={(tn) => updatebg__(tn)}/>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.txtdarl]}>no-Repeat sms 12hrs default on: </Text>
                        <Switch value={isrepeat} onValueChange={(tn) => noreap__(tn) }/>
                    </View>
                </View>
            </View>
        </SafeAreaView>  
    );
}


function ClearSelection({ navigation }){
    var[blocklist,setblocklist] = useState([])
    var[blklt,setblklt] = useState([])
    var[bws,setbws] = useState(['None'])

    const updatesettings = async ()=>{
        var exlist = []
        var fexlist = []
        fexlist = fexlist.concat(blocklist)
        fexlist = fexlist.concat(blklt)
        fexlist.forEach((ls,lsin)=>{
            var newsp = ls.split("_")
            var jax = newsp[0].split("+91")
            exlist.push(jax[jax.length-1].replace(/ /g,''))
            if(fexlist.length === lsin+1){
                AsyncStorage.setItem("exls", JSON.stringify({xls:exlist,fxls:fexlist,bs:bws})).then((g)=>{
                    ToastAndroid.show(`Block List Updated`, ToastAndroid.SHORT);
                    navigation.navigate('General Setting')
                }).catch((e)=>{
                    //hm.pusherrorlog('BLOCK_SET_ERROR',e)
                })
            }
        })
    }
    const removeSelected = async (k) =>{
        var newarray = []
        blklt.forEach((ele,index)=>{
            if(ele !== k){
                newarray.push(ele)
            }
            if(blklt.length === index+1){
                setblklt(newarray)
                ToastAndroid.show(`${k.split('_')[1]}`, ToastAndroid.SHORT);
            }
        })
    }

    
    useEffect(()=>{
        getData("isuser").then((data)=>{
            getData("exls").then((isexls)=>{
                if(isexls.xls !== "undefined" || isexls.xls.length !== 0){
                    console.log("done",isexls)
                    setblklt(isexls.fxls)
                }else{
                    console.log("d",isexls)     
                }
            }).catch(ex=>{
                //hm.pusherrorlog('BLOCK_GET_ERROR',ex)
            })
        }).catch((e)=>{
            //hm.pusherrorlog('BLOCK_USEEFFECT_ERROR',e)
        })
    },[]);
    return(
        <SafeAreaView style={[styles.safebodycontainer]}>
            <View style={[styles.ndefualtbodycontainer]}>
                <TouchableOpacity style={[styles.btn1,styles.vm1]} onPress={()=>{updatesettings()}}> 
                    <Text style={styles.btntxt1}>Update Your Block List</Text>
                </TouchableOpacity>
                <MultiSelect
                    items={[{i:"None",v:"None"},{i:"autores",v:"Block on Autorespones"},{i:"campaign",v:"Block on Campaign"},{i:"both",v:"Both"}]}
                    uniqueKey="i"
                    single={true}
                    onSelectedItemsChange={e=>{setbws(e)}}
                    selectText="Select Contacts"
                    selectedItems={bws}
                    onChangeInput={ (text)=> console.log(text)}
                    altFontFamily="ProximaNova-Light"
                    tagRemoveIconColor="#F70000"
                    tagBorderColor="#0000F7"
                    tagTextColor="#0000F7"
                    selectedItemTextColor="#0000F7"
                    selectedItemIconColor="#0000F7"
                    itemTextColor="#000"
                    displayKey="v"
                    searchInputStyle={{ color: '#CCC' }}
                    submitButtonColor="#A4986E"
                    fixedHeight={true}
                    submitButtonText="Submit"
                />
                <MultiSelect
                    items={syncconls}
                    uniqueKey="num"
                    onSelectedItemsChange={e=>{setblocklist(e)}}
                    selectText="Select Contacts"
                    selectedItems={blocklist}
                    searchInputPlaceholderText="Search Contacts..."
                    onChangeInput={ (text)=> console.log(text)}
                    altFontFamily="ProximaNova-Light"
                    tagRemoveIconColor="#F70000"
                    tagBorderColor="#0000F7"
                    tagTextColor="#0000F7"
                    selectedItemTextColor="#0000F7"
                    selectedItemIconColor="#0000F7"
                    itemTextColor="#000"
                    displayKey="name"
                    styleItemsContainer={styles.conhieght}
                    searchInputStyle={{ color: '#CCC' }}
                    submitButtonColor="#A4986E"
                    submitButtonText="Submit"
                />
                <ScrollView style={styles.schieght}>
                    {blklt.length !== 0 ?
                        _.map(blklt,(list_element)=>{
                            return (
                                <View style={[styles.row,styles.vm3,styles.br1]}>
                                    <Text style={[styles.txtdarl,styles.w80]}>{list_element.split("_")[1]} | {list_element.split("_")[0]}</Text>
                                    <TouchableOpacity style={[styles.bgdanger,styles.p1,styles.br1]} onPress={()=>{removeSelected(list_element)}}>
                                        <FontAwesomeIcon icon={ faTrash } size={ 12 } />
                                    </TouchableOpacity>
                                </View>
                            )
                        }) : null
                    }
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

function Test_({ navigation }){
    const btn_ = () =>{
        console.log(DeviceInfo.getModel())
        console.log(DeviceInfo.getBrand())
        console.log(DeviceInfo.getSystemName())
        console.log(DeviceInfo.getSystemVersion())
        getData("isuser").then((data)=>{
            fetch('http://senderapp.xysales.com/report/', {
                    method: 'POST',
                    mode:'cors',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "ticket":err_title,
                        "username": data.uid,
                        "av":DeviceInfo.getSystemVersion(),
                        "errlog":par_err.toString().replace(/'/g,'"'),
                        "dname":DeviceInfo.getModel()+"_"+DeviceInfo.getBrand()+"_"+DeviceInfo.getSystemName(),
                        "device":data.did,
                    })
                }).then((response) => response.json())
                .then((responseJson) => {
                    console.log(responseJson)
                    if(responseJson.status === "submited"){
                        console.log(responseJson)
                        console.log(typeof e)
                    }else{
                        console.log(responseJson)
                        console.log(e.toString().replace(/'/g,'"'))
                    }
                }).catch(er=>{
                    console.log("jack")
                    console.log(er)
                });
        }).catch((e)=>{
            console.log(e)
        })
        
    }
    return(
        <View style={styles.homebodycontainer}>
            <Text>Test</Text>
            <Button onPress={()=>{btn_()}} title='Report' />
        </View>
    );
}

class App extends Component {
    render(){
        return (
            <NavigationContainer>
                <Stack.Navigator initialRouteName="KhakiPost">
                    <Stack.Screen options={{headerShown: false}} name="HomeScreen" component={HomeScreen} />
                    <Stack.Screen options={{headerShown: false}} name="KhakiPost" component={InitScreen} />
                    <Stack.Screen name="Templates" component={Templates} />
                    <Stack.Screen name="Test_" component={Test_} />
                    <Stack.Screen name="TemplateOpt" component={Templateoption} />
                    <Stack.Screen name='ConSelectWithFilter' component={ConSelectWithFilter} />
                    <Stack.Screen name="CreateTemplates" component={CreateTemplates} />
                    <Stack.Screen name='ViewTemplates' component={ViewTemplates} />
                    <Stack.Screen name='Startmessage' component={Startmessage} />
                    <Stack.Screen name='Sendfromload' component={Sendfromload} />
                    <Stack.Screen name='Startmessagefile' component={Startmessagefile} />
                    <Stack.Screen name='Set Auto-Reply' component={SetQuickResponse} />
                    <Stack.Screen name='General Setting' component={Settings} />
                    <Stack.Screen name='ApkUpdate' component={UpdateScreen}  options={{headerShown: false}}/>
                    <Stack.Screen name='SUSPEND' component={SuspendScreen} options={{headerShown: false}} />
                    <Stack.Screen name='CommonErr' component={CommonErrScreen} options={{headerShown: false}} />
                    <Stack.Screen name='LoadingScreen' component={LoadingScreen} options={{headerShown: false}} />
                    <Stack.Screen name='SyncScreen' component={SyncUpdate} options={{headerShown: false}} />
                    {/* <Stack.Screen name='Block' component={Block} /> */}
                    <Stack.Screen name='Block' component={ClearSelection} />
                    
                    {/* <Stack.Screen options={{headerShown: false}} name='Permission page' component={Permissionspage} /> */}
                    
                    <Stack.Screen options={{headerShown: false}} name="Login" component={LoginScreen} />
                    <Stack.Screen options={{headerShown: false}} name="OTPScreen" component={OTPScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }
}


const styles = StyleSheet.create({
    txtdarl:{
        color:"#2C2C2C",
    },
    conhieght:{
        height:hp('40')
    },
    br1:{
        borderWidth:5,
        borderRadius:15,
        borderColor:"#0000F7",
    },fb:{
        fontWeight:'bold',
    },
    safebodycontainer:{
       padding:20, 
    },  
    defualtbodycontainer:{
        marginTop:hp('5'),
        padding:5,
        color:"#2C2C2C",
    },
    ndefualtbodycontainer:{
        marginTop:hp('2'),
        padding:2,
        color:"#2C2C2C",
    },
    homebodycontainer:{
        marginTop:hp('30'),
        padding:10,
        color:"#2C2C2C", 
    },
    mainbodycontainer:{
        marginTop:hp('15'),
        padding:10,
        color:"#2C2C2C", 
    },
    viewhome:{
        marginVertical:25,
        color:"#2C2C2C",
    },
    danger:{
        color:'#dc3545',
    },
    h3:{
      fontSize:26,
      fontWeight:'500',  
    },
    logotxt1:{
        fontSize:wp('16'),
        fontWeight:'bold',
        color:'#A4986E',
    },
    logotxt2:{
        fontSize:wp('9'),
        fontWeight:'bold',
        color:'#A4986E',
    },
    logotxt3:{
        fontSize:wp('12'),
        fontWeight:'bold',
        color:'#A4986E',
    },
    tagtxt1:{
        fontWeight:'400',
        color:'#333333',
        marginBottom:5,
    },
    tagtxt2:{
        fontWeight:'400',
        fontSize:26,
        color:'#333333',

        marginBottom:5,
    },
    tagtxt3:{
        fontWeight:'400',
        color:'#333333',
        fontSize:18,
    },
    tagtxt3:{
        fontWeight:'400',
        color:'#333333',
        fontSize:20,
    },
    btn1:{
        borderRadius:100,
        padding:12,
        textAlign:'center',
        backgroundColor:'#A4986E',
        marginBottom:5,
    },
    btntxt1:{
        fontWeight:'600',
        color:"#FFFFFF",
        textAlign:'center',
    },
    btntxt2:{
        fontWeight:'400',
        color:'#333333',
        marginBottom:5,
    },
    row:{
        flexDirection:'row',
        flexWrap:'wrap',
        marginVertical:20,
    },
    mR1:{
        marginRight:12,
    },
    mR2:{
        marginRight:18,
    },
    mR3:{
        marginRight:20,
    },
    mL1:{
        marginLeft:12,
    },
    mL2:{
        marginLeft:18,
    },
    mL3:{
        marginLeft:18,
    },
    hm1:{
        marginHorizontal:18,
    },
    textcenter:{
        textAlign:'center',
    },
    
    vm1:{
        marginVertical:25,
    },
    vm2:{
        marginVertical:20,
    },
    vm3:{
        marginVertical:15,
    },
    p1:{
        padding:10
    },
    br1:{
        borderRadius:12,
    },
    bgprimary:{
        backgroundColor:'#A4986E'
    },
    bgwarning:{
        backgroundColor:'#A4986E'
    },
    bgdanger:{
        backgroundColor:'#E61F23'
    },
    bgsuccess:{
        backgroundColor:'#A4986E'
    },
    bginfo:{
        backgroundColor:'#A4986E'
    },
    
    
    w55:{
        width:wp('55')
    },
    w60:{
        width:wp('60')
    },
    w65:{
        width:wp('65')
    },
    w70:{
        width:wp('70')
    },
    w75:{
        width:wp('75')
    },
    w80:{
        width:wp('80')
    },
    w85:{
        width:wp('85')
    },
    w90:{
        width:wp('90')
    },
    



    login_fields:{
        borderBottomWidth:1,
        color: '#000',
    },
    otp_fields:{
        height:60,
        fontSize:25,
        width:wp('25%'),
        borderBottomWidth:1,    
    },
    TemplateViewHeading:{
        fontSize:25,
        color:"#2C2C2C",
    },
    TemplateViewdate:{
        fontSize:21,
        color:"#2C2C2C",
    },
    TemplateViewBody:{
        color:"#2C2C2C",
        fontSize:18,
    },
    roundTextbox:{
        borderWidth:1,
        borderRadius:15,
        marginTop:12,
        padding:8,
        textAlignVertical: 'top',
        
    },
    homemenu:{
        marginLeft:20,
    },
    btnicon1:{
        height:hp(15),
        width:wp(30),
        borderRadius:18,
        backgroundColor:"#A4986E",
        justifyContent:'center',
        alignItems:'center',
    },
    
    
});

export default App;
