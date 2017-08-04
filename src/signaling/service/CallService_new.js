/*
 * CallService.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

/**
 * 音视频通话管理服务。
 *
 * @interface CallService
 * @author Guan Yong, Xu Jiangwei
 */
export class CallService extends CubeService {
    /**
     * 设置是否自动应答。
	 * <p>
     * 当使用自动应答时，用户同意浏览器调用设备摄像头和麦克风之后，引擎会自动调用 <code>answerCall()</code> 进行应答。
     * 也就是说当自动应答被激活后，引擎始终同意任何端的通话邀请。
	 * </p>
     *
     * @param {boolean} autoAnswer - 指定是否启用自动应答。
     */
    setAutoAnswer(autoAnswer) { }

    /**
     * 应当并接听通话邀请。
	 * @param cubeId {String}
	 * @returns {boolean} 如果应答请求发送成功则返回 <code>true</code>，否则返回 <code>false</code> 。
     */
    answerCall(cubeId) { }

    /**
     * 发起通话邀请。
	 *
     * @param {String} callee - 被叫方 Cube 号。
	 *  @param {boolean} videoEnabled - 是否启用视频。
	 * @param {Function} [callback] - 呼叫回调
     * @returns {boolean} 如果通话请求发送成功则返回 <code>true</code>，否则返回 <code>false</code> 。
     */
    makeCall(callee, videoEnabled, callback) {  }

    /**
     * 挂断通话。
	 * @param cubeId {String}
     */
    terminateCall() { }

	/**
	 *
	 */
	reply(target, timeout, callback) { }


    /**
	 * 获取当前所有会话
     * @return {CallSession}
     */
	callSessionList (callSession) { }

}
