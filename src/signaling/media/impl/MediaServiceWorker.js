/*
 * MediaServiceWorker.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

import {MediaService} from '../MediaService.js'

/**
 * 媒体服务实现。用于操作媒体设备。
 *
 * @class MediaServiceWorker
 * @see {@link CubeEngine#getMediaService|CubeEngine}
 * @author Xu Jiangwei, Guan Yong
 */
export class MediaServiceWorker extends MediaService {
    constructor(worker, canvasDomId) {
        super();
        this.worker = worker;
        this.canvas = null;
        this.timerList = [];
        this.probes = null;
        this.frameWarning = false;
        this.remoteMaxFrameRate = -1;
        this.remoteMinFrameRate = 120;

        // 离线录制器
        this.recorderMap = null;
        this.capturedUri = null;

        this._autoCaptureTimer = 0;
        this._localCalculateStats = null;
        this._remoteCalculateStats = null;

        if (undefined !== canvasDomId) {
            this.canvas = document.getElementById(canvasDomId);
        }

        let self = this;
        worker.videoCloseHandler = ()=> {
            Logger.d("CubeMediaController", "Video closed");

            for (let i = 0; i < self.timerList.length; ++i) {
                let timer = self.timerList[i];
                clearInterval(timer);
            }

            this.timerList.splice(0, self.timerList.length);

            if (null != self.probes && this.frameWarning) {
                for (let i = 0; i < this.probes.length; ++i) {
                    let p = this.probes[i];
                    p.onFrameRateRecovering(this, 0, 0, self.remoteMaxFrameRate);
                }
            }

            this.remoteMaxFrameRate = -1;
            this.remoteMinFrameRate = 120;
            this.frameWarning = false;

            if (this.isLocalRecording()) {
                this.stopLocalRecording(null);
            }
        };

        worker.localVideoReady = (video, worker)=> {
            this._localVideoReady(video, worker.videoEnabled);
        };
        worker.remoteVideoReady = (video, worker)=> {
            video.volume = 1;
            this._remoteVideoReady(video, worker.videoEnabled);
        };
    }

    /**
     * 添加媒体探针
     */
    addMediaProbe(probe) {
        if (null == this.probes) {
            this.probes = [probe];
        }
        else {
            this.probes.push(probe);
        }
    }

    /**
     * 删除媒体探针
     */
    removeMediaProbe(probe) {
        if (null == this.probes) {
            return false;
        }

        var index = this.probes.indexOf(probe);
        if (index >= 0) {
            this.probes.splice(index, 1);
            return true;
        }

        return false;
    }

    /**
     * 关闭本地语音流。关闭语音流后对方将无法听到本地麦克风采集的音频效果。
     */
    closeVoice() {
        if (null != this.worker.localStream && this.worker.localStream.getAudioTracks().length > 0) {
            this.worker.localStream.getAudioTracks()[0].enabled = false;
            return true;
        }

        return false;
    }

    /**
     * 关闭本地视频流。关闭视频后对方将无法看到本地摄像头采集到的视频影像。
     */
    closeVideo() {
        if (null != this.worker.localStream && this.worker.localStream.getVideoTracks().length > 0) {
            this.worker.localStream.getVideoTracks()[0].enabled = false;

            // 进行媒体操作同步
            this.worker.consult("video", "close");

            return true;
        }

        return false;
    }

    /**
     * 开启本地语音流。开启语音流后对方将能听到本地麦克风采集的音频效果。
     */
    openVoice() {
        if (null != this.worker.localStream && this.worker.localStream.getAudioTracks().length > 0) {
            this.worker.localStream.getAudioTracks()[0].enabled = true;
            return true;
        }

        return false;
    }

    /**
     * 开启本地视频流。开启视频后对方将能看到本地摄像头采集到的视频影像。
     */
    openVideo() {
        if (null != this.worker.localStream && this.worker.localStream.getVideoTracks().length > 0) {
            this.worker.localStream.getVideoTracks()[0].enabled = true;

            // 进行媒体操作同步
            this.worker.consult("video", "open");

            return true;
        }

        return false;
    }

    /**
     * 获取语音通话是否启用。
     */
    isVoiceEnabled() {
        if (null != this.worker.localStream && this.worker.localStream.getAudioTracks().length > 0) {
            return this.worker.localStream.getAudioTracks()[0].enabled;
        }

        return true;
    }

    /**
     * 获取视频通话是否启用。
     */
    isVideoEnabled() {
        if (null != this.worker.localStream && this.worker.localStream.getVideoTracks().length > 0) {
            return this.worker.localStream.getVideoTracks()[0].enabled;
        }

        return true;
    }

    /**
     * 设置扬声器音量。
     */
    setVolume(value) {
        if (null != this.worker.remoteVideo) {
            this.worker.remoteVideo.volume = value / 100;
        }
    }

    /**
     * 获取扬声器音量。
     */
    getVolume() {
        return parseInt(Math.round(this.worker.remoteVideo.volume * 100));
    }

    /**
     * 静音。
     */
    mute() {
        this.closeVoice();
    }

    /**
     * 获取本地视频分辨率大小。
     */
    getLocalVideoSize() {
        var v = this.worker.localVideo;
        var w = v.videoWidth;
        var h = v.videoHeight;
        return { width: w, height: h };
    }

    /**
     * 获取对方视频分辨率大小。
     */
    getRemoteVideoSize() {
        var v = this.worker.remoteVideo;
        var w = v.videoWidth;
        var h = v.videoHeight;
        return { width: w, height: h };
    }

    /**
     * 获取用户视频画面地址。
     */
    getCapturedCameraImage(peerName) {
        if (null == this.capturedUri) {
            return null;
        }

        return this.capturedUri + peerName + "/cube_captured_camera.jpg";
    }

    /**
     * 截取当前视频的画面。
     */
    capture(name, callback) {
        var canvas = this.canvas;
        var w = parseInt(this.worker.localVideo.videoWidth);
        var h = parseInt(this.worker.localVideo.videoHeight);
        canvas.setAttribute("width", w);
        canvas.setAttribute("height", h);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";

        var ctx = canvas.getContext('2d');
        if (this.worker.localStream) {
            ctx.drawImage(this.worker.localVideo, 0, 0);
            var dataURL = canvas.toDataURL('image/png');
            var self = this;
            Ajax.newRequest(_CUBE_SERVICE + "/" + "conference/capture?name=" + name).method("POST").content(dataURL).send(function(reponse) {
                if (reponse.getStatus() == 200) {
                    var rd = JSON.parse(reponse.getData());
                    self.capturedUri = rd.url;
                    if (undefined !== callback && null != callback) {
                        callback.call(null, rd);
                    }
                }
            });
        }
    }

    _startAutoCapture(name, callback) {
        if (null != this.canvas) {
            var self = this;
            if (self._autoCaptureTimer > 0) {
                return true;
            }

            self.capture(name, callback);

            self._autoCaptureTimer = setInterval(function() {
                self.capture(name, callback);
            }, 9000);

            return true;
        }
        else {
            return false;
        }
    }

    _stopAutoCapture() {
        if (this._autoCaptureTimer > 0) {
            clearInterval(this._autoCaptureTimer);
            this._autoCaptureTimer = 0;
        }
    }

    _localVideoReady(video, videoEnabled) {
        if (null != this.probes) {
            for (var i = 0; i < this.probes.length; ++i) {
                var p = this.probes[i];
                p.onLocalStreamReady(this);
            }

            if (videoEnabled) {
                var self = this;
                var counts = 0;
                this._localCalculateStats = this._calculateStats(video, function(v, fps, avg) {
                    if (!self.worker.videoEnabled) {
                        self._stopCalculate();
                        return;
                    }

                    ++counts;
                    if (counts < 5) {
                        return;
                    }
                    counts = 0;

                    for (var i = 0; i < self.probes.length; ++i) {
                        var p = self.probes[i];
                        p.onLocalVideoFPS(self, v.videoWidth, v.videoHeight, fps, avg);
                    }
                });
            }
        }
    }

    changeVideoElement(localVideo, remoteVideo){
        localVideo.volume = 0;
        remoteVideo.volume = this.getVolume() / 100;
        localVideo.src = this.worker.localVideo.src;
        remoteVideo.src = this.worker.remoteVideo.src;

        if (utils.isIE || utils.isSafari) {
            window.attachMediaStream(this.worker.localVideo, null);
            window.attachMediaStream(this.worker.remoteVideo, null);
        }
        else {
            this.worker.localVideo.src = "";
            this.worker.remoteVideo.src = "";
        }

        this.worker.localVideo = localVideo;
        this.worker.remoteVideo = remoteVideo;

        if(this._localCalculateStats != null){
            this._localCalculateStats.changeElement(localVideo);
        }
        if(this._remoteCalculateStats != null){
            this._remoteCalculateStats.changeElement(remoteVideo);
        }
    }

    _remoteVideoReady(video, videoEnabled) {
        if (null != this.probes) {
            for (var i = 0; i < this.probes.length; ++i) {
                var p = this.probes[i];
                p.onRemoteStreamReady(this);
            }

            if (videoEnabled) {
                var self = this;
                var counts = 0;
                this._remoteCalculateStats = this._calculateStats(video, function(v, fps, avg) {
                    if (!self.worker.videoEnabled) {
                        self._stopCalculate();
                        return;
                    }

                    if (v.videoWidth == 0 || v.videoHeight == 0) {
                        self._stopCalculate();
                        return;
                    }

                    // 计数
                    ++counts;

                    if (counts >= 5) {
                        for (var i = 0; i < self.probes.length; ++i) {
                            var p = self.probes[i];
                            p.onRemoteVideoFPS(self, v.videoWidth, v.videoHeight, fps, avg);
                        }

                        counts = 0;
                    }

                    // 探测远端视频帧率过低
                    if (self.remoteMaxFrameRate < fps) {
                        self.remoteMaxFrameRate = fps;
                    }
                    if (self.remoteMinFrameRate > fps) {
                        self.remoteMinFrameRate = fps;
                    }

                    if (fps <= self.remoteMaxFrameRate * 0.4
                        && fps <= avg * 0.4) {
                        self.frameWarning = true;

                        for (var i = 0; i < self.probes.length; ++i) {
                            var p = self.probes[i];
                            p.onFrameRateWarning(self, fps, avg, self.remoteMaxFrameRate);
                        }
                    }
                    else {
                        if (self.frameWarning) {
                            for (var i = 0; i < self.probes.length; ++i) {
                                var p = self.probes[i];
                                p.onFrameRateRecovering(self, fps, avg, self.remoteMaxFrameRate);
                            }

                            self.frameWarning = false;

                            if (fps >= 6) {
                                // 复位最大帧率
                                self.remoteMaxFrameRate = -1;
                            }
                        }
                    }
                });
            }
        }
    }

    _stopCalculate() {
        if (this.timerList.length == 0) {
            return;
        }

        for (var i = 0; i < this.timerList.length; ++i) {
            var timer = this.timerList[i];
            clearInterval(timer);
        }
        this.timerList.splice(0, this.timerList.length);
    }

    _calculateStats(video, callback) {
        var now = new Date().getTime();
        var decodedFrames = 0,
            droppedFrames = 0,
            startTime = now,
            initialTime = now;
        var timer = 0;

        timer = window.setInterval(function() {
            // see if webkit stats are available; exit if they aren't
            if (video.webkitDecodedFrameCount === undefined) {
                if (video.mozPaintedFrames === undefined) {
                    Logger.d("MediaController", "Video FPS calcs not supported");
                    clearInterval(timer);
                    return;
                }
            }

            // get the stats
            var currentTime = new Date().getTime();
            var deltaTime = (currentTime - startTime) / 1000;
            var totalTime = (currentTime - initialTime) / 1000;
            startTime = currentTime;

            var currentDecodedFPS = 0;
            var decodedFPSAvg = 0;

            // Calculate decoded frames per sec.
            if (video.mozPaintedFrames !== undefined) {
                //Logger.d("", video.mozDecodedFrames + ',' + video.mozParsedFrames + ',' + video.mozPresentedFrames + ',' + video.mozPaintedFrames);
                currentDecodedFPS  = (video.mozPaintedFrames - decodedFrames) / deltaTime;
                decodedFPSAvg = video.mozPaintedFrames / totalTime;
                decodedFrames = video.mozPaintedFrames;
            }
            else {
                currentDecodedFPS  = (video.webkitDecodedFrameCount - decodedFrames) / deltaTime;
                decodedFPSAvg = video.webkitDecodedFrameCount / totalTime;
                decodedFrames = video.webkitDecodedFrameCount;
            }

            // Calculate dropped frames per sec.
            /*
             var currentDroppedFPS = (video.webkitDroppedFrameCount - droppedFrames) / deltaTime;
             var droppedFPSavg = video.webkitDroppedFrameCount / totalTime;
             droppedFrames = video.webkitDroppedFrameCount;
             */

            if (currentDecodedFPS < 0 || currentDecodedFPS > 60) {
                currentDecodedFPS = 0;
            }

            callback.call(null, video, currentDecodedFPS.toFixed(), decodedFPSAvg.toFixed());

            if ((parseInt(video.width) == 0 && decodedFPSAvg == 0) || video.src == null) {
                clearInterval(timer);
            }
        }, 1000);

        this.timerList.push(timer);

        return {
            changeElement: function(newVideo){
                video = newVideo;
            }
        }
    }

    /**
     * 查询归档记录。
     */
    queryRecordArchives(name, success, error, cors) {
        if ("undefined" !== cors && cors) {
            var sn = "p" + Date.now();
            window._cube_cross.addCallback(sn, success, error);

            var src = window._cube_cross.host + "/archive/list.js?name=" + name + "&m=window._cube_cross.queryRecordArchives&sn=" + sn;
            var dom = document.createElement("script");
            dom.setAttribute("id", sn);
            dom.setAttribute("name", name.toString());
            dom.setAttribute("src", src);
            dom.setAttribute("type", "text/javascript");
            dom.onerror = function() {
                if (undefined !== error) {
                    error.call(null, name);
                }
                document.body.removeChild(dom);
            }
            document.body.appendChild(dom);
            return;
        }

        utils.requestGet("archive/list?name=" + name, function(data) {
            success.call(null, name, data);
        }, function(status) {
            if (undefined !== error) {
                error.call(null, name);
            }
        });
    }

    /**
     * 加载存档。
     */
    loadArchive(name, file, videoEl, cors) {
        var video = videoEl;
        if (typeof videoEl === 'string') {
            video = document.getElementById(videoEl);
        }

        if (undefined !== cors && cors) {
            video.src = window._cube_cross.host + "/archive/read?name=" + name + "&file=" + file;
        }
        else {
            video.src = "archive/read?name=" + name + "&file=" + file;
        }
    }

    /**
     * 是否存在本地存档记录。
     */
    hasLocalRecorded() {
        if (null == this.recorderMap) {
            return false;
        }

        return this.recorderMap.containsKey("LocalVideo");
    }

    /**
     * 是否正在录制本地视频。
     */
    isLocalRecording() {
        if (null == this.recorderMap) {
            return false;
        }

        var r = this.recorderMap.get("LocalVideo");
        if (r == null) {
            return false;
        }

        return r.recording;
    }

    /**
     * 启动本地音视频录制。
     */
    startLocalRecording(config) {
        if (null == this.worker.localStream) {
            return false;
        }

        return this.startRecording("LocalVideo", this.worker.localStream, config);
    }

    /**
     * 停止本地音视频录制。
     */
    stopLocalRecording(callback) {
        return this.stopRecording("LocalVideo", callback);
    }

    /**
     * 回放录制。
     */
    replayLocalRecording(videoEl, audioEl) {
        return this.replayRecording("LocalVideo", videoEl, audioEl);
    }

    /**
     * 获取本地归档记录。
     */
    getLocalRecorder() {
        return this.getRecorder("LocalVideo");
    }

    /**
     * 对方是否存在归档记录。
     */
    hasRemoteRecorded() {
        if (null == this.recorderMap) {
            return false;
        }

        return this.recorderMap.containsKey("RemoteVideo");
    }

    /**
     * 是否正在录制对方视频。
     */
    isRemoteRecording() {
        if (null == this.recorderMap) {
            return false;
        }

        var r = this.recorderMap.get("RemoteVideo");
        if (r == null) {
            return false;
        }

        return r.recording;
    }

    /**
     * 启动对方音视频录制。
     */
    startRemoteRecording(config) {
        if (null == this.worker.remoteStream) {
            return false;
        }

        return this.startRecording("RemoteVideo", this.worker.remoteStream, config);
    }

    /**
     * 停止对方音视频录制。
     */
    stopRemoteRecording(callback) {
        return this.stopRecording("RemoteVideo", callback);
    }

    /**
     * 获取对方归档记录。
     */
    getRemoteRecorder() {
        return this.getRecorder("RemoteVideo");
    }

    startRecording(task, mix, config) {
        var preview = null;
        var stream = null;
        if (typeof mix === 'string') {
            preview = document.getElementById(mix);
        }
        else if (mix.tagName !== undefined) {
            preview = mix;
        }
        else {
            stream = mix;
        }

        if (null == this.recorderMap) {
            this.recorderMap = new HashMap();
        }

        var recorder = null;
        // 创建记录器
        if (config !== undefined && null != config) {
            recorder = new CubeAdvancedRecorder(preview, config);
        }
        else {
            recorder = new CubeRecorder(preview);
        }

        // 记录
        this.recorderMap.put(task, recorder);

        // 启动记录器
        return recorder.startRecording(stream);
    }

    stopRecording(task, callback) {
        if (null == this.recorderMap) {
            return false;
        }

        var recorder = this.recorderMap.get(task);
        if (null == recorder) {
            return false;
        }

        var callTimer = 0;
        var ret = recorder.stopRecording(function(r) {
            if (null == callback) {
                return;
            }

            if (callTimer > 0) {
                clearTimeout(callTimer);
            }

            callTimer = setTimeout(function() {
                clearTimeout(callTimer);
                callback.call(null, recorder);
            }, 1000);
        });

        return ret;
    }

    replayRecording(task, videoEl, audioEl) {
        if (null == this.recorderMap) {
            return false;
        }

        var recorder = this.recorderMap.get(task);
        if (null == recorder) {
            return false;
        }

        var video = null;
        if (typeof videoEl === 'string') {
            video = document.getElementById(videoEl);
        }
        else {
            video = videoEl;
        }

        var audio = null;
        if (typeof audioEl === 'string') {
            audio = document.getElementById(audioEl);
        }
        else {
            audio = audioEl;
        }

        return recorder.replay(video, audio);
    }

    getRecorder(task) {
        if (null == this.recorderMap) {
            return null;
        }

        return this.recorderMap.get(task);
    }

    /**
     * 视频流处理
     *
     * @param {String} type 视频流操作类型, "open" - 开启视频流; "close" - 关闭视频流。
     * @memberof CubeMediaServiceWorker
	 * @instance
     */
    _videoProcess(type){
        for (var i = 0; i < this.probes.length; ++i) {
            var p = this.probes[i];
            if (type == "open") {
                p.onVideoOpen();
            }
            else if (type == "close") {
                p.onVideoClose();
            }
        }
    }
}
