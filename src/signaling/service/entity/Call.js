/**
 * Created by ShiXin on 2017/7/7.
 */

/**
 * 呼叫信息
 */
export class Call {
    constructor() {
        this.cubeId = null;
        this.displayName = null;
        this.isVideo = true;
        this.sdp = null;
        this.ices = [];
        this.candidates = [];
    }

    /**
     * 设置呼叫人信息
     * @param cubeId {String}
     */
    setCubeId(cubeId) {
        this.cubeId = cubeId;
    }

    getCubeId() {
        return this.cubeId;
    }

    /**
     * 呼叫人昵称
     * @param displayName {String}
     */
    setDisplayName(displayName) {
        this.displayName = displayName;
    }

    getDisplayName() {
        return this.displayName;
    }

    /**
     * sdp信息
     * @param sdp
     */
    setSdp(sdp) {
        this.sdp = sdp;
    }

    getSdp() {
        return this.sdp;
    }

    /**
     *获取ICE信息
     * @return {Array}
     */
    setIces(ices) {
        this.ices = ices;
    }

    getIces() {
        return this.ices;
    }

    setCandidates(candidates) {
        this.candidates = candidates;
    }

    getCandidates() {
        return this.candidates;
    }
}