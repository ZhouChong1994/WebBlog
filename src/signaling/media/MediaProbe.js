/*
 * MediaProbe.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */
/**
 * 媒体层探针接口。
 * 媒体层探针用于实时监测媒体设备的工作状态。
 *
 * @interface MediaProbe
 * @see {@link MediaService#addMediaProbe|MediaService}
 * @author Xu Jiangwei, Guan Yong
 */
export class MediaProbe {
    /**
      * 当本地视频数据就绪时该方法被调用。
      * 
      * @param {MediaService} mediaController - 媒体控制器实例。
      */
    onLocalStreamReady(mediaController) { }

    /**
     * 当远端视频数据就绪时该方法被调用
     * @param mediaController {MediaService} 媒体控制器实例
     */
    onRemoteStreamReady(mediaController) { }

    /**
     * 当本地视频帧率数据刷新时该方法被调用
     * @param mediaController {MediaService} 媒体控制器实例
     * @param videoWidth {Number} 视频画面宽度
     * @param videoHeight {Number} 视频画面高度
     * @param curFPS {Number} 视频当前帧率
     * @param avgFPS {Number} 视频平均帧率
     */
    onLocalVideoFPS(mediaController, videoWidth, videoHeight, curFPS, avgFPS) { }

    /**
     * 当远端视频帧率数据刷新时该方法被调用
     * @param mediaController {MediaService} 媒体控制器实例
     * @param videoWidth {Number} 视频画面宽度
     * @param videoHeight {Number} 视频画面高度
     * @param curFPS {Number} 视频当前帧率
     * @param avgFPS {Number} 视频平均帧率
     */
    onRemoteVideoFPS(mediaController, videoWidth, videoHeight, curFPS, avgFPS) { }

    /**
     * 当探针检测到帧率明显降低时该方法被调用
     * @param mediaController {MediaService} 媒体控制器实例
     * @param curFps {Number} 当前实时帧率
     * @param avgFps {Number} 视频平均帧率
     * @param maxFps {Number} 监测周期内的最大帧率
     */
    onFrameRateWarning(mediaController, curFps, avgFps, maxFps) { }

    /**
     * 当探针检测到帧率恢复时该方法被调用
     * @param mediaController {MediaService} 媒体控制器实例
     * @param curFps {Number} 当前实时帧率
     * @param avgFps {Number} 平均帧率
     * @param maxFps {Number} 监测周期内的最大帧率
     */
    onFrameRateRecovering(mediaController, curFps, avgFps, maxFps) { }

    /**
     * 当对方关闭视频时该方法被调用
     */
    onVideoClose() { }

    /**
     * 当对方开启视频时该方法被调用
     */
    onVideoOpen() { }
}