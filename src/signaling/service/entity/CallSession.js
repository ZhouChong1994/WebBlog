/**
 * Created by ShiXin on 2017/7/7.
 */

import {CallDirection} from '../dep/CallDirection.js'
/**
 * 多人会话信息
 */
export class CallSession {
    constructor() {
        this.caller = null;
        this.callee = null;
        this.inviteTimes = 0;
        //接通时间
        this.inCallTime = 0;
        //挂断时间
        this.endCallTime = 0;
        //被叫是否繁忙
        this.isBusy = false;
        this.direction = CallDirection.Outgoing;
    }

    /**
     * 主叫人信息
     * @param caller {Call}
     */
    setCaller(caller) {
        this.caller = caller;
    }

    getCaller() {
        return this.caller;
    }

    /**
     * 被叫人信息
     * @param callee {Call}
     */
    setCallee(callee) {
        this.callee = callee;
    }

    getCallee() {
        return this.callee;
    }

    setInviteTimes(inviteTimes) {
        this.inviteTimes = inviteTimes;
    }

    getInviteTimes() {
        return this.inviteTimes;
    }

    setInCallTime(inCallTime) {
        this.inCallTime = inCallTime;
    }

    getInCallTime() {
        return this.inCallTime;
    }

    setEndCallTime(endCallTime) {
        this.endCallTime = endCallTime;
    }

    getEndCallTime() {
        return this.endCallTime;
    }

}