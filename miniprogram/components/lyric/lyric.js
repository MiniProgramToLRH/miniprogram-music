let lyricHeight = 0 // 单行歌词高度

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isLyricShow: { // 是否显示歌词
      type: Boolean,
      value: false
    },
    lyric: String // 歌词
  },

  observers: {
    lyric (lrc) {
      if (lrc === '暂无歌词') {
        this.setData({
          lrcList: [{
            lrc,
            time: 0
          }],
          nowLyricIndex: -1
        })
      } else {
        this._parseLyric(lrc)
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    lrcList: [], // 歌词列表
    nowLyricIndex: 0, // 当前选中的歌词索引，用于高亮歌词
    scrollTop: 0 // 滚动条滚动的高度
  },

  lifetimes: {
    ready () {
      wx.getSystemInfo({
        success (res) {
          // 计算出 1rpx 的大小，64 为css样式中 min-height 的设置
          lyricHeight = res.screenWidth / 750 * 64
        }
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 更新歌词
    update (currentTime) {
      let lrcList = this.data.lrcList
      if (lrcList.length === 0) {
        return
      }
      // 处理 歌曲总时间 > 歌词内歌词的最大时间
      if (currentTime > lrcList[lrcList.length - 1].time) {
        if (this.data.nowLyricIndex != -1) {
          this.setData({
            nowLyricIndex: -1,
            scrollTop: lrcList.length * lyricHeight
          })
        }
      }
      for (let i = 0, len = lrcList.length; i < len; i ++) {
        if (currentTime <= lrcList[i].time) {
          this.setData({
            nowLyricIndex: i - 1,
            scrollTop: (i - 1) * lyricHeight
          })
          break
        }
      }
    },
    
    // 解析歌词
    _parseLyric (sLyric) {
      let line = sLyric.split('\n')
      let _lrcList = []
      line.forEach((elem) => {
        let time = elem.match(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g)
        if (time != null) {
          let lrc = elem.split(time)[1]
          let timeReg = time[0].match(/(\d{2,}):(\d{2})(?:\.(\d{2,3}))?/)
          // 把时间转换为秒
          let time2Seconds = parseInt(timeReg[1]) * 60 + parseInt(timeReg[2]) + parseInt(timeReg[3]) / 1000
          _lrcList.push({
            lrc,
            time: time2Seconds,
          })
        }
      })
      console.log('解析歌词：', _lrcList)
      this.setData({
        lrcList: _lrcList
      })
    }
  }
})
