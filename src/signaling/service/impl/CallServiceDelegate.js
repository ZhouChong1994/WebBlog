/*
 * CallServiceDelegate.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

import {SignalingState} from '../dep/SignalingState.js'

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
        this.startTime=0;
    }

    didInvite(worker, direction, callee, video) {
        Logger.d('CubeCallServiceDelegate', 'onNewCall');

        // 更新呼叫方向
        this.engine.session.callDirection = direction;
        this.engine.session.callState = SignalingState.Invite;
        this.engine.session.callTime=0;

        // 更新 CallPeer
        if (null == this.engine.session.callPeer || this.engine.session.callPeer.name != callee) {
            this.engine.session.setCallPeer(new CubePeer(callee));

            if (null != worker.targetData) {
                this.engine.session.callPeer.displayName = worker.targetData.displayName;
            }
        }

        this.onNewCall(direction, this.engine.session, video);

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

        // 更新显示名
        this.engine.session.callPeer.displayName = worker.targetData.displayName;
		// 更新状态
		this.engine.session.callState = SignalingState.Ringing;

        this.onCallRinging(this.engine.session);
    }

    didIncall(worker, direction, callee, sdp) {
        Logger.d('CubeCallServiceDelegate', 'onCallConnected');

        // 更新状态
        this.startTime=Date.now();
        this.engine.session.callState = SignalingState.Incall;

        this.onCallConnected(this.engine.session);

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

        this.engine.session.callState = SignalingState.End;
        this.engine.session.callTime= this.startTime==0?0:Date.now() - this.startTime;
        this.engine.session.callPeer = null;

        if (null != worker.videoCloseHandler) {
            worker.videoCloseHandler.call(null, worker);
        }

		this.onCallEnded(this.engine.session, action);

        worker.localVideo.style.visibility = 'hidden';
        worker.remoteVideo.style.visibility = 'hidden';
    }

    didProgress(worker, callee) {
        Logger.d('CubeCallServiceDelegate', 'onInProgress');

		// 更新状态
        this.engine.session.callState = SignalingState.Progress;

        this.onInProgress(this.engine.session);
    }

    didFailed(worker, callee, errorCode) {
        Logger.d('CubeCallServiceDelegate', 'onCallFailed');

		// 更新状态
        this.engine.session.callState = SignalingState.None;
        this.engine.session.callPeer = null;

        this.onCallFailed(this.engine.session, errorCode);

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
        Logger.d('CubeCallServiceDelegate', 'onReverseCall');
        this.onReverseCall(this.engine.session);
    }
}
