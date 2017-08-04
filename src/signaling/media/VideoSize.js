/*
 * VideoSize.js
 * Cube Engine
 * 
 * Copyright (c) 2015-2016 Cube Team. All rights reserved.
 */

/**
 * @typedef {Object} CubeSize
 * @property {Number} width - 宽度，单位：像素。
 * @property {Number} height - 高度，单位：像素。
 */

/**
 * 视频大小枚举。
 *
 * @readonly
 * @enum {CubeSize} VideoSize
 * @author Xu Jiangwei
 */
export const VideoSize = {
    /** 视频分辨率为 128×96 (12,288) 的尺寸设置。*/
    SQCIF: { width: 128, height: 96 },
    /** 视频分辨率为 160×120 (19,200) 的尺寸设置。*/
    QQVGA: { width: 160, height: 120 },
    /** 视频分辨率为 320×240 (76,800) 的尺寸设置。*/
    QVGA: { width: 320, height: 240 },
    /** 视频分辨率为 352×288 (101,376) 的尺寸设置。*/
    CIF: { width: 352, height: 288 },
    /** 视频分辨率为 640×480 (307,200) 的尺寸设置。*/
    VGA: { width: 640, height: 480 },
    /** 视频分辨率为 800×600 (480,000) 的尺寸设置。*/
    SVGA: { width: 800, height: 600 },
    /** 视频分辨率为 960×720 (691,200) 的尺寸设置。*/
    HD: { width: 960, height: 720 },
    /** 视频分辨率为 1024×768 (786,432) 的尺寸设置。*/
    XGA: { width: 1024, height: 768 },
    /** 视频分辨率为 1280×1024 (1,310,720) 的尺寸设置。*/
    SXGA: { width: 1280, height: 1024 },
    /** 视频分辨率为 1600×1200 (1,920,000) 的尺寸设置。*/
    UXGA: { width: 1600, height: 1200 },

    /** 视频分辨率为 400×240 (96,000) 的尺寸设置。*/
    WQVGA: { width: 400, height: 240 },
    /** 视频分辨率为 512×288 (147 456) 的尺寸设置。*/
    WCIF: { width: 512, height: 288 },
    /** 视频分辨率为 800×480 (384,000) 的尺寸设置。*/
    WVGA: { width: 800, height: 480 },
    /** 视频分辨率为 1024×600 (614,400) 的尺寸设置。*/
    WSVGA: { width: 1024, height: 600 },
    /** 视频分辨率为 1280×720 (921,600) 的尺寸设置。*/
    WHD: { width:1280, height: 720 },
    /** 视频分辨率为 1280×768 (983,040) 的尺寸设置。*/
    WXGA: { width: 1280, height: 768 },
    /** 视频分辨率为 1920×1200 (2,304,000) 的尺寸设置。*/
    WUXGA: { width: 1920, height: 1200 },

    /** 视频分辨率为 768×432 (331,776, a.k.a WVGA 16:9) 的尺寸设置。*/
    W432P: { width: 768, height: 432 },
    /** 视频分辨率为 768×480 (368,640, a.k.a WVGA 16:10) 的尺寸设置。*/
    W480P: { width: 768, height: 480 }
};