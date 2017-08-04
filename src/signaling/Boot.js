/*
 * Boot.js
 * Cube Engine
 *
 * Copyright (c) 2015-2017 Cube Team. All rights reserved.
 */

import {CallServiceWorker} from './service/impl/CallServiceWorker.js'
import {CallListener} from './service/CallListener.js'
import {CallDirection} from './service/dep/CallDirection.js'
import {SignalingState} from './service/dep/SignalingState.js'
import {VideoSize} from './media/VideoSize.js'
import {MediaProbe} from './media/MediaProbe.js'
import {MediaServiceWorker} from './media/impl/MediaServiceWorker.js'
import * as adapter from './lib/adapter.js'
import {Call} from './service/entity/Call.js'
import {CallSession} from './service/entity/CallSession.js'

/**
 * 引导程序, 负责模块的初始化工作。
 *
 * @author Guan Yong
 */
(function (global) {
    //var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    //global.RTCPeerConnection = RTCPeerConnection;

    //var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
    //global.RTCIceCandidate = RTCIceCandidate;

    //var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    //global.RTCSessionDescription = RTCSessionDescription;

    // Look after different browser vendors' ways of calling the getUserMedia()
    // API method:
    // Opera --> getUserMedia
    // Chrome --> webkitGetUserMedia
    // Firefox --> mozGetUserMedia
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    /*if (window.utils.isChrome && parseInt(webrtcDetectedVersion) >= 47) {
     window.getUserMedia = function(constraints, onSuccess, onError) {
     var p = navigator.mediaDevices.getUserMedia(constraints)
     .then(function(stream) {
     onSuccess(stream);
     });
     var ef = function(error) {
     onError(error);
     };
     p["catch"].call(p, ef);
     };
     }
     else {
     navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
     }*/

    if ((window.utils.isIE || window.utils.isSafari) && window.utils.isDesktop) {
        let s = document.createElement("script");
        s.setAttribute("src", "http://" + _CUBE_DOMAIN + "/libs/adapter-min.js");
        s.onload = function(e) {
            AdapterJS.webRTCReady(function(isUsingPlugin) {
                Logger.d("CubeEngine", "WebRTC Plugin Ready!");
            });
        };
        document.body.appendChild(s);
    }

    // 提供全局的接口类
    global.CubeCallServiceWorker = CallServiceWorker;
    global.CubeCallListener = CallListener;
    global.CubeCallDirection = CallDirection;
    global.CubeSignalingState = SignalingState;
    global.CubeVideoSize = VideoSize;
    global.CubeMediaProbe = MediaProbe;
    global.CubeMediaServiceWorker = MediaServiceWorker;
    global.webrtcAdapter = adapter;
    global.CubeCall = Call;
    global.CubeCallSession = CallSession;

})(window);