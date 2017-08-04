/*
 * CallServiceWorker.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

import {CallListener} from '../CallListener_new.js'
import {CallService} from '../CallService_new.js'
import {CallDirection} from '../dep/CallDirection.js'
import {SignalingState} from '../dep/SignalingState.js'
import {VideoSize} from '../../media/VideoSize.js'
import {CallServiceDelegate} from './CallServiceDelegate_new.js'
import {Call} from '../entity/Call.js'
import {CallSession} from '../entity/CallSession.js'

/**
 * 音/视频通话模块服务实现。
 */
export class CallServiceWorker extends CallService {
    constructor(engine, localVideo, remoteVideo, bellAudio) {
        super(engine, null, CELLET.Signaling);
        // 初始化委派
        this.delegate = new CallServiceDelegate(CallListener, engine);
        this.localVideo = localVideo;
        this.localVideo.muted = true;
        this.remoteVideo = remoteVideo;
        this.bellAudio = bellAudio;

        this.autoAnswer = false;

        // 挂断标签
        this.flagTerminated = false;

        this.target = null;
        this.targetData = null;

        this.direction = null;
        this.videoEnabled = true;
        this.state = SignalingState.None;

        this.sdpCache = null;

        // 带宽
        this.audioBandwidth = 70;
        this.videoBandwidth = 512;

        this.bellAudioPaused = false;

        // 是否主叫
        this.isInitiator = false;
        // 是否已经启动 WebRTC 流程
        this.isStarted = false;
        // 用户是否被正确注册
        this.isChannelReady = false;
        // 是否已向服务器发出邀请或者回应邀请
        this.hasResponded = false;

        // WebRTC data structures
        // Streams
        this.localStream = null;
        this.remoteStream = null;
        // PeerConnection
        this.pc = null;

        // local video ready callback
        this.localVideoReady = null;
        // remote video ready callback
        this.remoteVideoReady = null;
        // close callback
        this.videoCloseHandler = null;

        this.pcConstraints = {"optional": [{"DtlsSrtpKeyAgreement": true}]};

        this.sdpConstraints = {};
        this.candidateQueue = [];

        this.maxVideoSize = null;
        this.maxFrameRate = 15;
        this.minFrameRate = 8;

        this.iceTimer = 0;
        this.iceTimeout = 15000;

        this.hangupTimer = 0;
        this.hangupTimeout = 5000;

        // 应答回调
        this.replyCallback = null;
        this.replyTimer = 0;
        //保存多人会话信息 key:cubeId value:callSession
        this.saveCallSession = new HashMap();

        // 查询会议回调
        this.queryConferenceCb = null;
        this.queryConferenceErrorCb = null;

        this.canAddIceCandidate = false;
        this.lastIceServers = null;

        this._bodyOverflow = null;
        this._maskDom = null;
        this._maskHeight = 1080;

        this.currentCallSession = null;

        this.localVideo.addEventListener('loadeddata', (e) => {
            if (typeof this.localVideoReady === 'function') {
                this.localVideoReady(this.localVideo, this);
            }
        }, false);

        this.remoteVideo.addEventListener('loadeddata', (e) => {
            if (typeof this.remoteVideoReady === 'function') {
                this.remoteVideoReady(this.remoteVideo, this);
            }
        }, false);

        if (this.bellAudio) {
            this.bellAudio.addEventListener('loadeddata', (e) => {
                if (this.bellAudioPaused) {
                    return;
                }

                this.bellAudio.play();
            }, false);
        }
    }

    onStartup() {
        // 创建媒体控制器
        this.engine.sspMediaService = new CubeMediaServiceWorker(this);
    }

    /**
     * 设置是否自动应答。
     */
    setAutoAnswer(autoAnswer) {
        this.autoAnswer = autoAnswer;
    }

    /**
     * 接听。
     */
    answerCall(cubeId) {
        if (null === cubeId && typeof cubeId !== 'string') {
            return false;
        }
        let callSession = this.saveCallSession.get(cubeId);

        if (this.engine.session.callPeer.name.length <= 4 && null !== this.engine.sipService) {
            // 会议直接接听
            return this.engine.sipService.answer();
        }

        if (!this.isChannelReady) {
            return false;
        }

        if (this.isInitiator || null == this.sdpCache) {
            return false;
        }
        if (null === callSession.getCaller() && callSession.getCaller().getSdp()) {
            return false;
        }
        this.flagTerminated = false;

        var self = this;

        // Call getUserMedia()
        var mW = VideoSize.VGA.width;
        var mH = VideoSize.VGA.height;
        if (null != self.maxVideoSize) {
            if (self.maxVideoSize.width !== undefined)
                mW = self.maxVideoSize.width;
            if (self.maxVideoSize.height !== undefined)
                mH = self.maxVideoSize.height;
        }
        var constraints = {
            mandatory: {
                maxWidth: mW,
                maxHeight: mH,
                minWidth: 160,
                minHeight: 120,
                maxFrameRate: self.maxFrameRate,
                minFrameRate: self.minFrameRate
            }
        };
        if (window.utils.isFirefox) {
            /* var webrtcDetectedBrowser = null;
             var webrtcDetectedVersion = null;
             if (navigator.mozGetUserMedia) {
             webrtcDetectedBrowser = 'firefox';
             webrtcDetectedVersion = this.extractVersion(navigator.userAgent,
             /Firefox\/(\[0-9]+)\./, 1);
             }*/
            if (parseInt(webrtcAdapter.detectBrowser.result.version) < 43) {
                constraints = {
                    width: {min: 160, max: mW},
                    height: {min: 120, max: mH},
                    frameRate: {min: self.minFrameRate, max: self.maxFrameRate},
                    require: ["width", "height", "frameRate"]
                }
            }
            else {
                constraints = {
                    width: mW,
                    height: mH,
                    frameRate: self.minFrameRate
                }
            }
        }

        if ((utils.isIE || utils.isSafari) && window.getUserMedia) {
            navigator.getUserMedia = window.getUserMedia;
        }
        if (self.checkAndStart()) {
            // 回调正在处理
            self.delegate.didProgress(self, self.target);
            self.pc.setRemoteDescription(new RTCSessionDescription({
                type: "offer",
                sdp: callSession.getCaller().getSdp()
            }), function () {
                self.canAddIceCandidate = true;
                self.drainCandidateQueue();
                navigator.getUserMedia({"audio": true, "video": (self.videoEnabled ? constraints : false)},
                    function (e) {
                        self.handleUserMedia(e);

                        self.pc.addStream(self.localStream);
                        self.doAnswer();
                    },
                    function (e) {
                        self.isStarted = false;
                        self.handleUserMediaError(e);
                    });
            }, function () {
                self.onSignalingError(e);
            });
        }

        // 显示遮罩
        this._showMask();

        return true;
    }

    /**
     * 发起呼叫。
     */
    makeCall(cubeId, videoEnabled, callback) {
        //当前没有网络或者没有正确注册时回调
        if (!this.engine.networkConnected || !this.isChannelReady) {
            console.log(" CubeStateCode.NetworkNotReachable:" + CubeStateCode.NetworkNotReachable);
            this.delegate.didFailed(this, cubeId, CubeStateCode.NetworkNotReachable);
            return false;
        }

        if (this.hangupTimer > 0) {
            // 挂断定时器还在工作，不能启动新呼叫
            return false;
        }

        // 正在呼叫则返回
        if (this.engine.session.isCalling()) {
            return false;
        }

        this.flagTerminated = false;

        // 被叫号码
        // callee = callee.toString();
        this.direction = CallDirection.Outgoing;

        //设置呼叫信息
        let callee = new Call();
        callee.setCubeId(cubeId);
        callee.isVideo = videoEnabled;

        let caller = new Call();
        caller.setCubeId(this.engine.session.name);
        console.log(this.engine.session.displayName);
        caller.isVideo = videoEnabled;

        let callSession = new CallSession();
        callSession.setCallee(callee);
        callSession.setCaller(caller);
        callSession.direction = this.direction;
        this.saveCallSession.put(cubeId, callSession);

        // 设置呼叫状态
        this.engine.session.callState = SignalingState.Progress;

        this.engine.session.setCallPeer(new CubePeer(cubeId));
        return this.invite(cubeId, videoEnabled);
    }

    /**
     * 挂断通话。
     */
    terminateCall() {
        this.flagTerminated = true;

        let sspRet = false;
        let sipRet = false;

        sspRet = this.hangup();

        if (null !== this.engine.sipService) {
            sipRet = this.engine.sipService.hangup();
        }

        return (sspRet || sipRet);
    }

    tryHold(hold, tryCounts) {
        // Nothing
    }

    invite(callee, videoEnabled) {
        if (!this.isChannelReady) {
            return false;
        }

        this.hasResponded = false;
        this.lastIceServers = _CUBE_STUN_SERVERS;

        var self = this;
        // 呼叫目标
        self.target = callee.toString();
        // 主叫
        self.isInitiator = true;
        self.direction = CallDirection.Outgoing;
        self.videoEnabled = videoEnabled;

        // 更新状态
        self.state = SignalingState.Invite;

        // 回调正在邀请
        self.delegate.didInvite(self, self.direction, self.target, self.videoEnabled);

        var mW = 320;
        var mH = 240;
        if (null != self.maxVideoSize) {
            if (self.maxVideoSize.width !== undefined)
                mW = self.maxVideoSize.width;
            if (self.maxVideoSize.height !== undefined)
                mH = self.maxVideoSize.height;
        }

        Logger.d("SignalingWorker", "Camera resolution: " + mW + "x" + mH);

        // Call getUserMedia()
        var constraints = {
            "mandatory": {
                "maxWidth": mW,
                "maxHeight": mH,
                "minWidth": 160,
                "minHeight": 120,
                "maxFrameRate": self.maxFrameRate,
                "minFrameRate": self.minFrameRate
            }
        };
        if (window.utils.isFirefox) {
            if (parseInt(webrtcAdapter.detectBrowser.result.version) < 43) {
                constraints = {
                    width: {min: 160, max: mW},
                    height: {min: 120, max: mH},
                    frameRate: {min: self.minFrameRate, max: self.maxFrameRate},
                    require: ["width", "height", "frameRate"]
                }
            }
            else {
                constraints = {
                    width: mW,
                    height: mH,
                    frameRate: self.minFrameRate
                }
            }
        }
        if ((utils.isIE || utils.isSafari) && window.getUserMedia) {
            navigator.getUserMedia = window.getUserMedia;
        }
        if (self.checkAndStart()) {
            // 回调正在处理
            self.delegate.didProgress(self, self.target);
            navigator.getUserMedia({"audio": true, "video": videoEnabled ? constraints : false},
                function (e) {
                    self.handleUserMedia(e);
                    self.pc.addStream(self.localStream);
                },
                function (e) {
                    self.isStarted = false;
                    self.handleUserMediaError(e);
                });
        } else {
            // 报告状态错误
            self.delegate.didFailed(self, self.target, CubeStateCode.SignalingStartError);
        }

        Logger.d('SignalingWorker', 'Getting user media with constraints');

        // 显示遮罩
        this._showMask();

        return true;
    }

    hangup() {
        if (this.state == SignalingState.None) {
            return false;
        }

        if (this.hangupTimer > 0) {
            clearTimeout(this.hangupTimer);
        }

        var self = this;
        var target = this.target.toString();

        this.hangupTimer = setTimeout(function () {
            clearTimeout(self.hangupTimer);
            self.hangupTimer = 0;

            self.delegate.didEnd(self, target, "bye-ack");
        }, this.hangupTimeout);

        if (this.state == SignalingState.Incall) {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionBye);
            dialect.appendParam('param', {'call': this.target});
            nucleus.talkService.talk(CELLET.Signaling, dialect);

            this._cleanCall();
        }
        else if (this.state == SignalingState.Invite
            || this.state == SignalingState.Ringing) {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionCancel);
            dialect.appendParam('param', {'call': this.target});
            nucleus.talkService.talk(CELLET.Signaling, dialect);

            this._cleanCall();
        }
        else {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionBye);
            dialect.appendParam('param', {'call': this.target});
            nucleus.talkService.talk(CELLET.Signaling, dialect);

            this._cleanCall();
        }

        this.hasResponded = false;

        return true;
    }

    _cleanCall() {
        this.canAddIceCandidate = false;

        if (this.iceTimer > 0) {
            clearTimeout(this.iceTimer);
            this.iceTimer = 0;
        }

        // 处理铃声
        if (null != this.bellAudio) {
            this.bellAudioPaused = true;
            this.bellAudio.pause();
        }

        try {
            if (utils.isIE || utils.isSafari) {
                this.localVideo = document.getElementById(this.localVideo.id);
                window.attachMediaStream(this.localVideo, null);
            }
            else {
                this.localVideo.src = "";
            }
        } catch (e) {
            Logger.w("SignalingWorker#clean", e.message);
        }

        try {
            if (utils.isIE || utils.isSafari) {
                this.remoteVideo = document.getElementById(this.remoteVideo.id);
                window.attachMediaStream(this.remoteVideo, null);
            }
            else {
                this.remoteVideo.src = "";
            }
        } catch (e) {
            Logger.w("SignalingWorker#clean", e.message);
        }

        if (null != this.localStream) {
            try {
                this.localStream.stop();
            } catch (e) {
            }

            try {
                this.localStream.getAudioTracks()[0].stop();
                if (this.localStream.getVideoTracks()[0]) {
                    this.localStream.getVideoTracks()[0].stop();
                }
            } catch (e) {
            }

            this.localStream = null;
        }
        if (null != this.remoteStream) {
            try {
                this.remoteStream.getAudioTracks()[0].stop();

                if (this.remoteStream.getVideoTracks()[0]) {
                    this.remoteStream.getVideoTracks()[0].stop();
                }
            } catch (e) {
                Logger.w("SignalingWorker#clean", e.message);
            }

            this.remoteStream = null;
        }

        if (null != this.pc) {
            this.pc.close();
            this.pc = null;
        }
        this.saveCallSession.clear();
        this.direction = null;
        this.target = null;
        this.targetData = null;
        this.state = SignalingState.None;
        this.isInitiator = false;
        this.isStarted = false;
        this.sdpCache = null;
    }

    /**
     * 当注册状态变更时触发
     * @param session {CubeSession} 会话对象
     */
    onRegisterStateChanged(session) {
        if (session.regState == CubeRegistrationState.Ok) {
            this.isChannelReady = true;
        }
        else {
            this.isChannelReady = false;

            this.hangup();
        }
    }

    tryReInvite() {
        if (TalkService.getInstance().isCalled(CELLET.Signaling)) {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionTryReInvite);
            nucleus.talkService.talk(CELLET.Signaling, dialect);
        }

    }

    onDialogue(action, dialect) {
        if (action == CubeConst.ActionInviteAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionInviteAck);
            this._processInviteAck(dialect);
        }
        else if (action == CubeConst.ActionInvite) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionInvite);
            this._processInvite(dialect);
        }
        else if (action == CubeConst.ActionAnswerAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionAnswerAck);
            this._processAnswerAck(dialect);
        }
        else if (action == CubeConst.ActionAnswer) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionAnswer);
            this._processAnswer(dialect);
        }
        else if (action == CubeConst.ActionByeAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionByeAck);
            this._processByeAck(dialect);
        }
        else if (action == CubeConst.ActionBye) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionBye);
            this._processBye(dialect);
        }
        else if (action == CubeConst.ActionCancelAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionCancelAck);
            this._processCancelAck(dialect);
        }
        else if (action == CubeConst.ActionCancel) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionCancel);
            this._processCancel(dialect);
        }
        else if (action == CubeConst.ActionCandidate) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionCandidate);
            this._processCandidate(dialect);
        }
        else if (action == CubeConst.ActionCandidateAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionCandidateAck);
            this._processCandidateAck(dialect);
        }
        else if (action == CubeConst.ActionConsult) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionConsult);
            this._processConsult(dialect);
        }
        else if (action == CubeConst.ActionConsultAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionConsultAck);
            this._processConsultAck(dialect);
        }
        else if (action == CubeConst.ActionReply) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionReply);
            this._processReply(dialect);
        }
        else if (action == CubeConst.ActionReplyAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionReplyAck);
            this._processReplyAck(dialect);
        }
        else if (action == CubeConst.ActionConferenceAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionConferenceAck);
            this._processConferenceAck(dialect);
        }
        else if (action == CubeConst.ActionConference) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionConference);
            this._processConference(dialect);
        }
        else if (action == CubeConst.ActionQueryConferenceAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionQueryConferenceAck);
            this._processQueryConference(dialect);
        }
        else if (action == CubeConst.ActionQueryAllConferenceAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionQueryAllConference);
            this._processQueryAllConference(dialect);
        }
        else if (action == CubeConst.ActionTryReInviteAck) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionTryReInviteAck);
            this._processTryReInviteAck(dialect);
        }
        else if (action == CubeConst.ActionReverseCall) {
            Logger.d('SignalingWorker#onDialogue', CubeConst.ActionReverseCall);
            this._processReverseCall(dialect);
        }
    }

    setBandwidth(audio, video) {
        this.audioBandwidth = audio;
        this.videoBandwidth = video;
    }

    getLocalVideo() {
        return this.localVideo;
    }

    getRemoteVideo() {
        return this.remoteVideo;
    }

    // 协商
    consult(media, operation) {
        if (this.state != SignalingState.Incall) {
            return false;
        }

        var peer = this.engine.session.callPeer.name.toString();
        var payload = {
            "ver": 1,
            "media": media,
            "operation": operation
        };

        var dialect = new ActionDialect();
        dialect.setAction(CubeConst.ActionConsult);
        dialect.appendParam('param', {"peer": peer, "payload": payload});
        return nucleus.talkService.talk(CELLET.Signaling, dialect);
    }

    // 请求对端给予应答
    reply(target, timeout, callback) {
        if (this.replyTimer > 0) {
            return false;
        }

        this.replyCallback = callback;

        var self = this;
        this.replyTimer = setTimeout(function () {
            clearTimeout(self.replyTimer);
            self.replyTimer = 0;

            self.replyCallback.call(null, false, target, null);
        }, timeout);

        var param = {
            "target": target,
            "originate": Date.now()
        }
        var dialect = new ActionDialect();
        dialect.setAction(CubeConst.ActionReply);
        dialect.appendParam("param", param);
        return nucleus.talkService.talk(CELLET.Signaling, dialect);
    }

    // Channel negotiation trigger function
    checkAndStart() {
        if (!this.isStarted) {
            // 创建 PeerConnection
            if (!this.createPeerConnection()) {
                // 发生错误
                return false;
            }

            // 标记为已启动
            this.isStarted = true;

            return true;
        }
        else {
            return false;
        }
    }

    // PeerConnection management...
    createPeerConnection() {
        var self = this;
        try {
            var config = {"iceServers": self.lastIceServers};

            self.pc = new RTCPeerConnection(config, self.pcConstraints);
            self.pc.onicecandidate = function (e) {
                self.handleIceCandidate(e);
            };
            self.pc.oniceconnectionstatechange = function (e) {
                self.handleIceConnectionStateChange(e);
            };
            self.pc.onconnectionstatechange = function (e) {
                self.handleConnectionStateChange(e);
            };
            self.pc.onnegotiationneeded = function () {
                // 主叫发起呼叫
                if (self.isInitiator) {
                    self.doCall();
                }
            };

            //Logger.d('SignalingWorker', 'Created RTCPeerConnnection with:\n  config: \'' +
            //		JSON.stringify(config) + '\';\n  constraints: \'' +
            //		JSON.stringify(self.pcConstraints) + '\'.');
        } catch (e) {
            Logger.d('SignalingWorker', 'Failed to create PeerConnection, exception: ' + e.message);
            //alert('Cannot create RTCPeerConnection object.');

            self.delegate.didFailed(self, self.target, CubeStateCode.RTCInitializeFailed);

            self._cleanCall();

            return false;
        }

        self.pc.onaddstream = function (e) {
            self.handleRemoteStreamAdded(e);
        };
        self.pc.onremovestream = function (e) {
            self.handleRemoteStreamRemoved(e);
        };

        // Data channel
        /*
         if (isInitiator) {
         try {
         // Create a reliable data channel
         sendChannel = pc.createDataChannel("sendDataChannel", {reliable: true});
         trace('Created send data channel');
         } catch (e) {
         alert('Failed to create data channel. ');
         trace('createDataChannel() failed with exception: ' + e.message);
         }
         sendChannel.onopen = handleSendChannelStateChange;
         sendChannel.onmessage = handleMessage;
         sendChannel.onclose = handleSendChannelStateChange;
         }
         else { // Joiner
         pc.ondatachannel = gotReceiveChannel;
         }*/

        return true;
    }

    doCall() {
        Logger.d('SignalingWorker', 'Creating Offer...');
        var self = this;
        // 创建 Offer
        self.pc.createOffer(
            function (sessionDescription) {
                sessionDescription.sdp = self._fixSdp(sessionDescription.sdp);
                self.setLocalAndSendInvite(sessionDescription);
            },
            function (e) {
                self.onSignalingError(e);
            }, self.sdpConstraints);
    }

    doAnswer() {
        Logger.d('SignalingWorker', 'Creating Answer...');
        var self = this;
        // 创建 Answer
        self.pc.createAnswer(
            function (sessionDescription) {
                sessionDescription.sdp = self._fixSdp(sessionDescription.sdp);
                self.setLocalAndSendAnswer(sessionDescription);
            },
            function (e) {
                self.onSignalingError(e);
            }, self.sdpConstraints);
    }

    setLocalAndSendInvite(sessionDescription) {
        var self = this;
        // set local SDP
        this.pc.setLocalDescription(sessionDescription, function () {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionInvite);
            dialect.appendParam('param', {
                'callee': self.target,
                'sdp': self.pc.localDescription.sdp,
                'ICEServers': _CUBE_ICE_SERVERS
            });

            let callSession = self.saveCallSession.get(self.target);
            console.log(self.target + '----setLocalAndSendInvite-----');
            callSession.getCaller().setSdp(self.pc.localDescription.sdp);
            callSession.getCaller().setIces(_CUBE_ICE_SERVERS);
            callSession.setInviteTimes(Date.now());
            self.saveCallSession.put(self.target, callSession);
            let ret = nucleus.talkService.talk(CELLET.Signaling, dialect);
            if (ret) {
                self.hasResponded = true;
            }
            else { //若发包失败则挂断,不再等待
                self.hasResponded = false;
                setTimeout(() => {
                    self.delegate.didFailed(self, self.target, CubeStateCode.SignalingStartError);
                    self.hangup();
                }, 8000)
            }

            Logger.d("SignalingWorker#setLocalAndSendInvite", "Offer:\n" + self.pc.localDescription.sdp);
        }, function (error) {
            Logger.e('SignalingWorker', 'set local description error: ' + error);
            self.onSignalingError(e);
        });
    }

    setLocalAndSendAnswer(sessionDescription) {
        var self = this;
        // set local SDP
        this.pc.setLocalDescription(sessionDescription, function () {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionAnswer);
            dialect.appendParam('param', {'caller': self.target, 'sdp': self.pc.localDescription.sdp});
            console.log(self.target + '----setLocalAndSendAnswer-----');

            var ret = nucleus.talkService.talk(CELLET.Signaling, dialect);

            // 处理 ICE Candidate
            self.drainCandidateQueue();

            if (ret) {
                self.hasResponded = true;
            }
            else {
                self.hasResponded = false;
                self.delegate.didFailed(self, self.target, CubeStateCode.SignalingStartError);
                self.hangup();
            }

            Logger.d("SignalingWorker#setLocalAndSendAnswer", "Answer:\n" + self.pc.localDescription.sdp);
        }, function (error) {
            Logger.e('SignalingWorker', 'set local description error: ' + error);
            self.onSignalingError(e);
        });
    }

    attachMediaStream(video, stream) {
        if ((utils.isIE || utils.isSafari) && window.attachMediaStream) {
            window.attachMediaStream(video, stream);
            return;
        }

        video.onloadedmetadata = function (e) {
            video.play();
        };

        if (window.URL) {
            // Chrome case: URL.createObjectURL() converts a MediaStream to a blob URL
            video.src = window.URL.createObjectURL(stream);
        }
        else {
            // Firefox and Opera: the src of the video can be set directly from the stream
            video.src = stream;
        }
    }

    handleUserMedia(stream) {
        this.localStream = stream;
        this.attachMediaStream(this.localVideo, stream);

        if ((utils.isIE || utils.isSafari) && this.localVideo.tagName.toLowerCase() == "video") {
            this.localVideo = document.getElementById(this.localVideo.id);
        }

        // 本地视频静音
        this.localVideo.muted = true;
        // 本地视频控制器不可用
        this.localVideo.controls = false;

        Logger.d('SignalingWorker', 'Adding local stream.');

        // 关闭遮罩
        this._closeMask();
    }

    handleUserMediaError(error) {
        // 关闭遮罩
        this._closeMask();

        Logger.e("SignalingWorker", "Navigator.getUserMedia error"/* + JSON.stringify(error)*/);

        this.hangup();
        this.delegate.didFailed(this, this.target, CubeStateCode.CameraOpenFailed);
    }

    handleIceCandidate(event) {
        if (event.candidate) {
            var dialect = new ActionDialect();
            dialect.setAction(CubeConst.ActionCandidate);
            dialect.appendParam('param', {
                'peer': this.target, 'candidate': {
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    sdp: event.candidate.candidate
                }
            });
            nucleus.talkService.talk(CELLET.Signaling, dialect);
        }
        else {
            Logger.d('SignalingWorker', 'End of candidates.');
        }
    }

    handleIceConnectionStateChange(event) {
        if (null == this.pc) {
            return;
        }

        var state = this.pc.iceConnectionState;
        if (null == state || undefined === state) {
            return;
        }

        if (state == "failed") {
            Logger.w('CubeCallService#handleIceConnectionStateChange', 'Ice connection state change - state is ' + state + ', hasResponded is ' + this.hasResponded);
            if (this.hasResponded) {
                this.hangup();
            }
            this.delegate.didFailed(this, this.target, CubeStateCode.ICEConnectionFailed);
        } else if (state == "disconnected" || state == "closed") {
            this.delegate.didEnd(this, this.target, "end");
            this._cleanCall();
        }
    }

    handleConnectionStateChange(event) {
        switch (this.pc.connectionState) {
            case "connected":
                Logger.d("CallService", "State: connected");
                break;
            case "disconnected":
                Logger.d("CallService", "State: disconnected");
                break;
            case "failed":
                Logger.d("CallService", "State: failed");
                break;
            case "closed":
                Logger.d("CallService", "State: closed");
                break;
            default:
                break;
        }
    }

    handleRemoteStreamAdded(event) {
        try {
            if (null != this.bellAudio) {
                this.bellAudioPaused = true;
                this.bellAudio.pause();
            }
        } catch (e) {
        }

        if (this.iceTimer > 0) {
            clearTimeout(this.iceTimer);
            this.iceTimer = 0;
        }

        this.remoteStream = event.stream;
        this.attachMediaStream(this.remoteVideo, event.stream);

        if ((utils.isIE || utils.isSafari) && this.remoteVideo.tagName.toLowerCase() == "video") {
            this.remoteVideo = document.getElementById(this.remoteVideo.id);
        }
    }

    handleRemoteStreamRemoved(event) {
        Logger.d('SignalingWorker', 'Remote stream removed. Event: ' + event);

        if (this.iceTimer > 0) {
            clearTimeout(this.iceTimer);
            this.iceTimer = 0;
        }
    }

    drainCandidateQueue() {
        for (var i = 0; i < this.candidateQueue.length; ++i) {
            var candidate = this.candidateQueue[i];
            this.pc.addIceCandidate(candidate);
        }

        this.candidateQueue.splice(0, this.candidateQueue.length);
        this.candidateQueue = [];
    }

    // 由 WebRTC 引发的错误
    onSignalingError(error) {
        Logger.w('SignalingWorker#onSignalingError', 'Failed to create signaling message : ' + error.name);

        // FIXME 发生错误后应当终止呼叫
        if (this.hasResponded) {
            this.delegate.didFailed(this, this.target, CubeStateCode.WorkerStateException);
            this.hangup();
        }
    }

    _setBandwidth(sdp) {
        sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + this.audioBandwidth + '\r\n');
        sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + this.videoBandwidth + '\r\n');
        sdp = sdp.replace(/a=mid:sdparta_0\r\n/g, 'a=mid:sdparta_0\r\nb=AS:' + this.audioBandwidth + '\r\n');
        sdp = sdp.replace(/a=mid:sdparta_1\r\n/g, 'a=mid:sdparta_1\r\nb=AS:' + this.videoBandwidth + '\r\n');
        return sdp;
    }

    _fixSdp(sdp) {
        var ret = this._setBandwidth(sdp);
        //sdp = sdp.replace(/a=candidate+/g, '');
        return ret;
    }

    _processInviteAck(dialect) {
        var state = dialect.getParam("state");
        var code = state.code;
        if (code < 200 || code > 299) {
            Logger.w('CubeCallService#_processInviteAck', 'In error code is:' + code);
            this.delegate.didFailed(this, this.target, code);
            this.hangup();
            return;
        } else if (code != 200) {
            Logger.w('CubeCallService#_processInviteAck', 'A state code that has no effect : ' + code);
        }

        if (this.direction == CallDirection.Outgoing) {
            var callee = dialect.getParam("callee");

            // 目标数据
            this.targetData = dialect.getParam('calleeData');

            // 更新状态
            this.state = SignalingState.Ringing;

            this.delegate.didRinging(this, callee);

            // Ringing 响铃
            if (null != this.bellAudio) {
                this.bellAudioPaused = false;
                this.bellAudio.loop = true;
                this.bellAudio.src = cube.resourcePath + "/sounds/ringbacktone.ogg";
            }
        }
    }

    _processInvite(dialect) {
        /* // 判断是否正在处于会议中
         if (this.engine.session.isCalling()) {
         // 若当前正在进行通话，不挂断，新用户允许呼入
         /!*setTimeout(function () {
         var response = new ActionDialect();
         response.setAction(CubeConst.ActionCancel);
         response.appendParam('call', dialect.getParam('caller'));
         nucleus.talkService.talk(CELLET.Signaling, response);
         }, 1000);
         Logger.e('CallServiceWorker#_processInvite', 'Peer is calling, hangup: ' + dialect.getParam('caller'));*!/

         Logger.d('CallServiceWorker#_processInvite', dialect.getParam('caller') + '-Peer is calling me');
         return;
         }*/

        if (this.state == SignalingState.None || this.state == SignalingState.Invite) {
            // 被叫
            this.isInitiator = false;
            // 呼入
            this.direction = CallDirection.Incoming;
            // 更新状态
            this.state = SignalingState.Invite;

            // Ringing 响铃
            if (null != this.bellAudio) {
                this.bellAudioPaused = false;
                this.bellAudio.loop = true;
                this.bellAudio.src = cube.resourcePath + "/sounds/ringtone.ogg";
            }

            var data = dialect.getParam('data');
            var caller = data.caller;
            var sdp = data.sdp;
            var iceServers = data.ICEServers;
            var callerDara = data.callerData;

            if (null != iceServers) {
                this.lastIceServers = this.engine._parseICEServers(iceServers);
            } else {
                this.lastIceServers = _CUBE_STUN_SERVERS;
            }
            // 保存 SDP
            this.sdpCache = sdp;
            this.targetData = callerDara;

            let s = JSON.stringify(sdp);
            var videoEnabled = false;
            if (s.indexOf('m=video') >= 0) {
                videoEnabled = true;
            }

            this.videoEnabled = videoEnabled;
            var self = this;
            // 目标
            self.target = caller.toString();
            // console.log(this.targetData.displayName + '--_processInvite--' + this.targetData.name);

            let caller = new Call();
            caller.setCubeId(self.target);
            caller.setSdp(sdp);
            caller.setDisplayName(self.targetData.displayName);
            caller.setIces(self.lastIceServers);

            let callee = new Call();
            callee.setCubeId(self.engine.session.name);
            callee.isVideo = videoEnabled;

            var callSession = new CallSession();
            callSession.setCaller(caller);
            callSession.setCallee(callee);

            if (callSession.getInviteTimes() == 0) {
                callSession.setInviteTimes(Date.now())
            }

            callSession.direction = self.direction;
            self.saveCallSession.put(self.target, callSession);


            if (self.autoAnswer) {
                setTimeout(function () {
                    self.answerCall();
                }, 60);
            }

            self.delegate.didInvite(self, self.direction, self.target, videoEnabled);

            // 显示遮罩
            //this._showMask();
        }
        else {
            Logger.e('SignalingWorker#_processInvite', 'Signaling state error: ' + this.state);
        }
    }

    _processAnswerAck(dialect) {
        // 处理铃声
        if (null != this.bellAudio) {
            this.bellAudioPaused = true;
            this.bellAudio.pause();
        }

        var state = dialect.getParam("state");
        if (state.code < 200 || state.code > 299) {
            // 错误
            this.delegate.didFailed(this, this.target, state.code);
            this.hangup();
            return;
        } else if (state.code != 200) {
            Logger.w('CubeCallService#_processInviteAck', 'A state code that has no effect : ' + state.code);
        }

        if (this.direction == CallDirection.Incoming) {
            var caller = dialect.getParam("caller");

            /* let callSession = this.saveCallSession.get(caller);
             this.saveCallSession.put(caller, callSession);*/
            // 更新状态
            this.state = SignalingState.Incall;

            this.delegate.didIncall(this, this.direction, caller, null);
        }
    }

    _processAnswer(dialect) {
        if (this.direction == CallDirection.Outgoing) {
            var callee = dialect.getParam("callee");
            var sdp = dialect.getParam("sdp");
            var self = this;

            // 设置对端 SDP
            self.pc.setRemoteDescription(new RTCSessionDescription({type: "answer", sdp: sdp}), function () {
                self.canAddIceCandidate = true;
                // 处理 ICE Candidate
                self.drainCandidateQueue();
            });
            /*  let callSession = self.saveCallSession.get(callee);

             callSession.getCallee().setSdp(sdp);
             self.saveCallSession.put(callee, callSession);*/
            // 更新状态
            this.state = SignalingState.Incall;

            // 处理铃声
            if (null != this.bellAudio) {
                this.bellAudioPaused = true;
                this.bellAudio.pause();
            }

            this.delegate.didIncall(this, this.direction, callee, sdp);

            if (this.iceTimer > 0) {
                clearTimeout(this.iceTimer);
            }

            this.iceTimer = setTimeout(function () {
                clearTimeout(self.iceTimer);
                self.iceTimer = 0;

                // ICE 超时
                self.delegate.didFailed(self, self.target, CubeStateCode.ICEConnectionFailed);

                // 挂断本次通话
                self.hangup();
            }, this.iceTimeout);
        }
    }

    _processByeAck(dialect) {
        if (this.hangupTimer > 0) {
            clearTimeout(this.hangupTimer);
            this.hangupTimer = 0;
        }
        let caller = dialect.getParam('call');
        this.target = caller.toString();
        this.delegate.didEnd(this, this.target, "bye-ack");
        this._cleanCall();
    }

    _processCancelAck(dialect) {
        if (this.hangupTimer > 0) {
            clearTimeout(this.hangupTimer);
            this.hangupTimer = 0;
        }
        let caller = dialect.getParam('call');
        this.target = caller.toString();
        this.delegate.didEnd(this, this.target, "cancel-ack");
        this._cleanCall();
    }

    _processBye(dialect) {
        if (this.state == SignalingState.None) {
            return;
        }
        let callee = dialect.getParam('call');
        this.target = callee.toString();
        this.delegate.didEnd(this, this.target, "bye");
        this._cleanCall();
    }

    _processCancel(dialect) {
        if (this.state == SignalingState.None) {
            return;
        }
        let data = dialect.getParam('data');
        let caller = dialect.getParam('call');
        this.target = caller.toString();
        // 判断发 cancel 动作的用户是否是当前通话的对方
        if (null !== this.engine.session.getCallPeer() && data.call !== this.engine.session.getCallPeer().name) {

            return;
        }

        let reason = dialect.getParam('reason');
        let action = 'cancel';
        if (null !== reason) {
            if (reason.code === CubeStateCode.AnswerByOther) {
                action = 'answer-by-other';
            } else if (reason.code === CubeStateCode.CancelByOther) {
                action = 'cancel-by-other';
            }
        }

        this.delegate.didEnd(this, this.target, action);
        this._cleanCall();
    }

    _processCandidate(dialect) {
        var jsonCandidate = dialect.getParam("candidate");
        var peer = dialect.getParam("peer");
        let param = {
            sdpMLineIndex: jsonCandidate.sdpMLineIndex,
            sdpMid: jsonCandidate.sdpMid,
            candidate: jsonCandidate.sdp
        };
        var candidate = new RTCIceCandidate(param);
        let callSession = this.saveCallSession.get(peer);

        if (callSession.getCallee().getCubeId() == peer) {
            callSession.getCallee().setCandidates(param);
        }
        else if (callSession.getCaller().getCubeId() == peer) {
            callSession.getCaller().setCandidates(param);
        }
        this.saveCallSession.put(peer,callSession);
        console.log('======>' + param);
        if (this.canAddIceCandidate) {
            this.pc.addIceCandidate(candidate);
        } else {
            this.candidateQueue.push(candidate);
        }

    }

    _processCandidateAck(dialect) {
        // Nothing
    }

    _processTryReInviteAck(dialect) {

        Logger.d('CallServiceWorker#_processTryReInviteAck is code : ', dialect.getParam('state').code)
    }

    _processReverseCall(dialect) {
        //清空主动呼叫的数据
        if (null !== this.localStream) {
            this.localStream == null;
            this.direction = null;
            this.isInitiator = false;
            this.isStarted = false;
            this.sdpCache = null;
        }
        let data = dialect.getParam('data');
        let target = data.caller;
        let sdp = data.sdp;
        let iceServers = data.iceServers;
        this.sdpCache = sdp;
        if (null != iceServers) {
            this.lastIceServers = this.engine._parseICEServers(iceServers);
        } else {
            this.lastIceServers = _CUBE_STUN_SERVERS;
        }

        //自动发送answer
        setTimeout(() => {
            this.answerCall(target);
        }, 60);
        this.delegate.didReverseCall(this, target,);
    }

    _processConsult(dialect) {
        var peer = dialect.getParam("peer");
        var payload = dialect.getParam("payload");

        // 判断当前对端是否是正确的对端
        if (peer === this.engine.session.callPeer.name) {
            if (payload.ver === 1) {
                if (payload.media === "video") {
                    if (payload.operation === "close") {
                        try {
                            this.localStream.getVideoTracks()[0].enabled = false;
                        } catch (e) {
                            // Nothing
                        }
                    }
                    else if (payload.operation === "open") {
                        try {
                            this.localStream.getVideoTracks()[0].enabled = true;
                        } catch (e) {
                            // Nothing
                        }
                    }
                    window.cube.getMediaService()._videoProcess(payload.operation);
                }
            }
        }
        else {
            Logger.w("SignalingWorker#_processConsult", "Session peer error: " + peer);
        }
    }

    _processConsultAck(dialect) {
        // Nothing
    }

    _processReply(dialect) {
        var ack = new ActionDialect();
        ack.setAction(CubeConst.ActionReplyAck);
        ack.appendParam("from", this.engine.session.name.toString());
        ack.appendParam("to", dialect.getParam("from"));
        ack.appendParam("time", dialect.getParam("time"));
        nucleus.talkService.talk(CELLET.Signaling, ack);
    }

    _processReplyAck(dialect) {
        var cur = Date.now();

        if (this.replyTimer > 0) {
            clearTimeout(this.replyTimer);
            this.replyTimer = 0;
        }

        var time = dialect.getParam("time");
        time.local = cur;
        // 计算行程
        time.remoteLatency = time.transmit - time.reference;
        time.localLatency = (cur - time.originate) - (time.transmit - time.receive);
        if (null != this.replyCallback) {
            this.replyCallback.call(null, true, dialect.getParam("from"), time);
        }
    }

    _processConferenceAck(dialect) {
        var confService = this.engine.getConferenceService();
        if (null != confService) {
            confService.processDialectAck(dialect);
        }
    }

    _processConference(dialect) {
        var confService = this.engine.getConferenceService();
        if (null != confService) {
            confService.processDialect(dialect);
        }
    }

    queryConference(groupName, callback, errorCallback) {
        this.queryConferenceCb = callback;

        if (undefined !== errorCallback) {
            this.queryConferenceErrorCb = errorCallback;
        }

        var dialect = new ActionDialect();
        dialect.setAction(CubeConst.ActionQueryConference);
        dialect.appendParam("param", {"token": _MSTR_TOKEN, "group": groupName});
        return nucleus.talkService.talk(CELLET.Signaling, dialect);
    }

    _processQueryConference(dialect) {
        var state = dialect.getParam("state");
        if (state.code == 200) {
            if (null != this.queryConferenceCb) {
                if (dialect.getParam("conference") !== undefined) {
                    this.queryConferenceCb.call(null, dialect.getParam("conference"));
                    this.queryConferenceCb = null;
                }
                else if (null != this.queryConferenceErrorCb) {
                    this.queryConferenceErrorCb.call(null, CubeStateCode.NotFoundConference);
                    this.queryConferenceErrorCb = null;
                }
            }
        }
        else {
            if (null != this.queryConferenceErrorCb) {
                this.queryConferenceErrorCb.call(null, state.code);
                this.queryConferenceErrorCb = null;
            }
        }
    }

    _processQueryAllConference(dialect) {
        let state = dialect.getParam("state");
        let data = dialect.getParam("data");
        let confService = this.engine.getConferenceService();
        if (state.code == 200) {
            if (null != confService) {
                confService.queryAllCallback(state.code, data.conferences);
            }
        }
        else {
            this.delegate.onConferenceFailed(new CubeError(state.code, 'Quit Conference Failed!'));
        }
    }

    _showMask() {
        this._closeMask();

        this._bodyOverflow = document.body.style.overflow;

        var w = window.innerWidth;
        var h = parseInt(window.innerHeight) + 70;
        if (h > this._maskHeight) {
            this._maskHeight = h;
        }

        document.body.style.overflow = "hidden";

        if (null == this._maskDom) {
            //var mask = [''];

            var c = document.createElement("div");
            c.id = "_cube_mask_";
            c.style.position = "absolute";
            c.style.styleFloat = "left";
            c.style.cssFloat = "left";
            c.style.left = "0px";
            c.style.top = "0px";
            c.style.width = w + "px";
            c.style.height = this._maskHeight + "px";
            c.style.zIndex = 9999;
            c.style.opacity = 0.6;
            c.style.mozOpacity = 0.6;
            c.style.webkitOpacity = 0.6;
            c.style.background = "#000";
            //c.innerHTML = mask.join('');

            var self = this;
            c.addEventListener('dblclick', function (e) {
                self._closeMask();
            }, false);

            this._maskDom = c;
        }
        else {
            this._maskDom.style.left = "0px";
            this._maskDom.style.top = "0px";
            this._maskDom.style.width = w + "px";
            this._maskDom.style.height = this._maskHeight + "px";
        }

        document.body.appendChild(this._maskDom);
    }

    _closeMask() {
        if (null != this._bodyOverflow) {
            document.body.removeChild(this._maskDom);
            document.body.style.overflow = this._bodyOverflow;

            this._bodyOverflow = null;
        }
    }

    onConfigure(config) {
        this.maxVideoSize = config.videoSize;
        this.minFrameRate = config.frameRate.min;
        this.maxFrameRate = config.frameRate.max;
        this.setBandwidth(config.bandwidth.audio, config.bandwidth.video);
    }
}