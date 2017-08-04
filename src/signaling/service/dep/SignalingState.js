/*
 * SignalingState.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */
/**
 * 信令状态。
 *
 * @readonly
 * @enum {Number} SignalingState
 * @author Xu Jiangwei
 */
export const SignalingState = {

	/** 空状态。信令停止工作状态。 */
    None: 0,

	/** 正在处理状态。 */
    Progress: 1,

	/** 发起呼叫邀请状态。 */
    Invite: 2,

	/** 对方振铃状态。 */
    Ringing: 3,

	/** 呼叫进行中状态。 */
    Incall: 4,

	/** 呼叫结束状态。 */
    End: 5
};
