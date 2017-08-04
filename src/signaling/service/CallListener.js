/*
 * CallListener.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

/**
 * 音视频通话监听器。
 * <p>
 * 通过实现监听器的回调接口可以监听到呼叫状态，从而发起对应的操作。
 * 此监听器可以收到的监听事件涵盖了呼叫会话的所有环节。
 * </p>
 *
 * @interface CallListener
 * @author Xu Jiangwei, Guan Yong
 */
export class CallListener extends CubeListener {
    /**
     * 当发起新呼叫或者收到呼叫时被回调。
     *
     * @param {CubeCallDirection} direction - 指示呼叫时呼入还是呼出。
     * @param {Session} session - 当前引擎的会话。
     * @param {boolean} video - 是否启用了视频呼叫。
     */
    onNewCall(direction, session, video) { }

    /**
     * 当呼叫正在处理时被回调。
	 *
     * @param {Session} session 呼叫会话
     */
    onInProgress(session) { }

    /**
     * 当对方振铃时被回调。
	 *
     * @param {Session} session - 当前引擎的会话。
     */
    onCallRinging(session) { }

    /**
     * 当呼叫已经接通时被回调。
     *
     * @param {Session} session - 当前引擎的会话。
     */
    onCallConnected(session) { }

	onCallHold(session) { }

    /**
     * 当呼叫结束时被回调。
	 *
     * @param {Session} session - 当前引擎的会话。
     * @param {String} action - 结束方式。
     */
    onCallEnded(session, action) { }

    /**
     * 当呼叫发生错误时被回调。
     *
     * @param {Session} session - 当前引擎的会话。
     * @param {StateCode} errorCode - 错误码。
     */
    onCallFailed(session, errorCode) { }

    /**
     * 呼叫反转
     * @param session
     */
    onReverseCall(session) { }
}