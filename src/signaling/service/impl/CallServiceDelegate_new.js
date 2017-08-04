/*
 * CallServiceDelegate.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

import {SignalingState} from '../dep/SignalingState.js'
import {CallDirection} from '../dep/CallDirection.js'

/**
 * 通话服务委托类。
 *
 * @class CallServiceDelegate
 * @author Guan Yong, Xu Jiangwei
 */
export class CallServiceDelegate extends CubeDelegate {
    /**
     * @constructs CallServiceDelegate
     * @param {CallListener} listenerInterface 用于父类实现通用Delegate功能
     * @param {CubeEngine} engine 引擎引用
     */
    constructor(listenerInterface, engine) {
        super(listenerInterface);
        this.engine = engine;
        this.startTime = 0;
    }

    didInvite(worker, direction, callee, video) {
        Logger.d('CubeCallServiceDelegate', 'onCall');

        // 更新呼叫方向
        this.engine.session.callDirection = direction;
        this.engine.session.callState = SignalingState.Invite;
        // this.engine.session.callTime=0;
        let callSession = worker.saveCallSession.get(callee);


        // 更新 CallPeer
        if (null == this.engine.session.callPeer || this.engine.session.callPeer.name != callee) {
            this.engine.session.setCallPeer(new CubePeer(callee));

            if (null !== worker.targetData && worker.direction === CallDirection.Incoming) {
                this.engine.session.callPeer.displayName = worker.targetData.displayName;
                callSession.getCaller().setDisplayName(worker.targetData.displayName);
            }
        }
        worker.saveCallSession.put(callee, callSession);
        this.onCall(callSession, video);

        // 启动应答机
        if (this.engine.session.isConferenceCall()) {
            var conf = this.engine.getConferenceService().getConference();
            if (null != conf) {
                this.engine.responder.start(conf.host, false);
            }
        }
        else {
            /*var stunUrls = _CUBE_STUN_SERVERS[0].urls;
             var stunUrl;
             if (typeof stunUrls == 'string') {
             stunUrl = stunUrls.split(':')[1];
             } else {
             stunUrl = stunUrls[0].split(':')[1];
             }*/
            this.engine.responder.start(_CUBE_DOMAIN, true);
        }

        worker.localVideo.style.visibility = 'visible';
    }

    didRinging(worker, callee) {
        Logger.d('CubeCallServiceDelegate', 'onCallRinging');
        let callSession = worker.saveCallSession.get(callee);
        // 更新显示名
        callSession.getCallee().setDisplayName(worker.targetData.displayName);
        worker.saveCallSession.put(callee, callSession);
        // this.engine.session.callPeer.displayName = worker.targetData.displayName;
        // 更新状态
        this.engine.session.callState = SignalingState.Ringing;

        this.onCallRinging(callSession);
    }

    didIncall(worker, direction, callee, sdp) {
        Logger.d('CubeCallServiceDelegate', 'onCallConnected');

        // 更新状态
        this.startTime = Date.now();
        this.engine.session.callState = SignalingState.Incall;

        let callSession = worker.saveCallSession.get(callee);
        callSession.setInCallTime(Date.now());
        callSession.getCallee().setSdp(sdp);
        worker.saveCallSession.put(callee, callSession);
        this.onCallConnected(callSession);

        worker.remoteVideo.style.visibility = 'visible';
    }

    didEnd(worker, callee, action) {
        Logger.d('CubeCallServiceDelegate', 'onCallEnded');

        // 关闭应答机
        this.engine.responder.stop();

        // 更新状态
        if (this.engine.session.callState == SignalingState.End) {
            return;
        }
        if (null != worker.videoCloseHandler) {
            worker.videoCloseHandler.call(null, worker);
        }
        this.engine.session.callState = SignalingState.End;
        // this.engine.session.callTime= this.startTime==0?0:Date.now() - this.startTime;
        // this.engine.session.callPeer = null;

        if (null !== callee) {
            let callSession = worker.saveCallSession.get(callee);
            if (null !== callSession ) {
                var EndCallTime = callSession.setEndCallTime(Date.now());

                worker.saveCallSession.put(callee, callSession);
            }

            this.onCallEnded(callSession, action);
        }
        else {
            this.onCallEnded(this.engine.session, action);
        }

        // this.onCallEnded(callSession, action);

        worker.localVideo.style.visibility = 'hidden';
        worker.remoteVideo.style.visibility = 'hidden';
    }

    didProgress(worker, callee) {
        Logger.d('CubeCallServiceDelegate', 'onInProgress');

        // 更新状态
        this.engine.session.callState = SignalingState.Progress;
        let callSession = worker.saveCallSession.get(callee);
        this.onInProgress(callSession);
    }

    didFailed(worker, callee, errorCode) {
        Logger.d('CubeCallServiceDelegate', 'onCallFailed');

        // 更新状态
        this.engine.session.callState = SignalingState.None;
        // this.engine.session.callPeer = null;

        let callSession = worker.saveCallSession.get(callee);

        this.onCallFailed(callSession, errorCode);

        worker.localVideo.style.visibility = 'hidden';
        worker.remoteVideo.style.visibility = 'hidden';

        // 关闭应答机
        this.engine.responder.stop();

        /*var self = this;
         if (errorCode != CubeErrorCode.CameraOpenFailed) {
         setTimeout(function() {
         self.engine.getCallService().terminateCall();
         }, 1000);
         }*/

        /*if (null != worker.videoCloseHandler) {
         worker.videoCloseHandler.call(null, worker);
         }*/
    }

    didReverseCall(worker, callee) {
        Logger.d('CubeCallServiceDelegate', 'onCallFailed');
        let callSession = worker.saveCallSession.get(callee);
        this.onReverseCall(callSession);
    }
}
