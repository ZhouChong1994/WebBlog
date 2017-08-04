/*
 * MediaService.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */
/**
 * 媒体服务
 * @interface MediaService
 * @author Xu Jiangwei, Guan Yong
 */
export class MediaService {
    /**
     * 添加媒体探针。
     *
     * @param {CubeMediaProbe} probe - 指定待添加的媒体探针实例。
	 * @returns {boolean} 添加成功返回<code>true</code>，否则返回 <code>false</code> 。
     */
    addMediaProbe(probe) { }

    /**
     * 移除媒体探针。
	 *
     * @param {CubeMediaProbe} probe - 指定删除的媒体探针实例。
     * @returns {boolean} 删除成功返回<code>true</code>，否则返回 <code>false</code> 。
     */
    removeMediaProbe(probe) { }

    /**
     * 关闭本地语音流。关闭语音流后对方将无法听到本地麦克风采集的音频数据。
     *
     * @returns {boolean} 如果关闭成功返回 <code>true</code>，否则返回 <code>false</code> 。
     */
    closeVoice() {  }

    /**
     * 关闭本地视频流。关闭视频后对方将无法看到本地摄像头采集到的视频影像。
     *
     * @returns {boolean} 如果关闭成功返回 <code>true</code>，否则返回 <code>false</code> 。
     */
    closeVideo() { }

    /**
     * 开启本地语音流。开启语音流后对方将能听到本地麦克风采集的音频数据。
	 *
     * @returns {boolean} 如果开启成功返回 <code>true</code>，否则返回 <code>false</code> 。
     */
    openVoice() { }

    /**
     * 开启本地视频流。开启视频后对方将能看到本地摄像头采集到的视频影像。
     *
     * @returns {boolean} 如果开启成功返回 <code>true</code>，否则返回 <code>false</code> 。
     */
    openVideo() { }

    /**
     * 当前通话的语音通道是否启用。
     *
     * @returns {boolean} 返回<code>true</code>表示启用，<code>false</code>表示禁用。
     */
    isVoiceEnabled() { }

    /**
     * 当前通话的视频通道是否启用。
	 *
     * @returns {boolean} 返回<code>true</code>表示启用，<code>false</code>表示禁用。
     */
    isVideoEnabled() { }

    /**
     * 设置扬声器音量。
	 *
     * @param {Number} value - 指定正整数类型的音量值，取值范围：0 到 100，表示音量由低到高。
     */
    setVolume(value) { }

    /**
     * 获取当前扬声器音量。
	 *
     * @returns {Number} 正整数类型的音量值，数值范围：0 到 100，表示音量由低到高。
     */
    getVolume() { }

    /**
     * 静音。
     */
    mute() { }

    /**
     * 获取本地视频分辨率大小。
	 *
     * @returns {CubeSize} 视频画面宽高，单位：像素。
     */
    getLocalVideoSize() { }

    /**
     * 获取对方视频分辨率大小。
     *
     * @returns {CubeSize} 视频画面宽高，单位：像素。
     */
    getRemoteVideoSize() { }

    /**
     * 获取用户视频画面地址。
     *
     * @param {String} peerName - 指定需要获取的用户 Cube 号。
     */
    getCapturedCameraImage(peerName) { }

    /**
     * 截取当前视频的画面。
     *
     * @param {String} name - 指定需要截取的一方的 Cube 号。
     * @param {Function} callback - 回调函数。
     */
    capture(name, callback) { }

    /**
     * 查询归档记录。
	 *
     * @param {String} name - 指定待查询的 Cube 号。
     * @param {Function} success - 指定查询数据后的回调函数。
     * @param {Function} error - 指定查询失败时的回调函数。
     */
    queryRecordArchives(name, success, error, cors) { }

    /**
     * 加载存档。
	 *
     * @param {String} name - 指定待加载存档的 Cube 号。
     * @param {String} file - 需要加载的存档文件。
     * @param {String} videoEl - 显示存档的元素节点ID。
     */
    loadArchive(name, file, videoEl, cors) { }

    /**
     * 是否存在本地存档记录。
	 *
     * @returns {boolean} 返回<code>true</code>表示有本地存档记录, <code>false</code>表示没有。
     */
    hasLocalRecorded() { }

    /**
     * 是否正在录制本地视频。
     *
     * @returns {boolean} 返回<code>true</code>表示正在录制, <code>false</code>表示没有录制。
     */
    isLocalRecording() { }

    /**
     * 启动本地音视频录制。
     *
     * @param {Object} config - 指定录像参数。参数包括：interval (录制切片间隔)
     * @returns {boolean} 返回启动录制是否成功。
     */
    startLocalRecording(config) { }

    /**
     * 停止本地音视频录制。
     *
     * @param {Function} callback - 指定录像结束时的回调函数。
     * @returns {boolean} 返回是否正确处理停止。
     */
    stopLocalRecording(callback) { }

    /**
     * 回放录制。
     *
     * @param {String} videoEl - 需要播放的视频元素ID 。
     * @param {String} audioEl - 需要播放的音频元素ID 。
     * @returns {boolean} 返回回放是否成功。
     */
    replayLocalRecording(videoEl, audioEl) { }

    /**
     * 获取本地归档记录。
     *
     * @returns {(CubeAdvancedRecorder | CubeRecorder)} - 归档存储实例
     */
    getLocalRecorder() { }

    /**
     * 对方的视频是否存在归档记录。
     *
     * @returns {boolean} 返回是否存在归档记录。
     */
    hasRemoteRecorded() { }

    /**
     * 是否正在录制对方视频。
     *
     * @returns {boolean} 返回<code>true</code>表示正在录制, <code>false</code>表示没有录制。
     */
    isRemoteRecording() { }

    /**
     * 启动对方音视频录制。
	 *
     * @param {Object} config - 指定录像参数。参数包括：interval (录制切片间隔)。
     * @returns {boolean} 返回是否录制成功。
     */
    startRemoteRecording(config) { }

    /**
     * 停止对方音视频录制。
     *
     * @param {Function} callback - 指定录像结束时的回调函数。
     * @returns {boolean} 返回录制是否启动停止。
     */
    stopRemoteRecording(callback) { }

    /**
     * 获取对方归档记录。
     *
     * @returns {(CubeAdvancedRecorder | CubeRecorder)} - 归档存储实例。
     */
    getRemoteRecorder() { }

    /**
     * 修改播放视频元素。
     *
     * @param {Document} localVideo 本地视频元素。
     * @param {Document} remoteVideo 对方视频元素。
     */
    changeVideoElement(localVideo, remoteVideo) { }
}