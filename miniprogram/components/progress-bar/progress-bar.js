let movableAreaWidth = 0 // <movable-area>区域宽度
let movableViewWidth = 0 // <movable-view>区域宽度
// // 获取全局唯一的背景音频管理器
const backgroundAudioManager = wx.getBackgroundAudioManager()
let currentSec = -1 // 当前的描述
let duration = 0 // 当前歌曲的总时长，以秒为单位
let isMoving = false // 表示当前进度条是否在拖拽，解决：当进度条拖动的时候 和 updatetime事件 的冲突

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    isSame: Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {
    showTime: {
      currentTime: '00:00', // 当前歌曲播放时间
      totalTime: '00:00' // 当前歌曲总共时间
    },
    movableDis: 0, // <movable-view> 定义x轴方向的偏移
    progress: 0 // <progress> 当前进度条的百分比
  },

  lifetimes: {
    ready () {
      if (this.properties.isSame && this.data.showTime.totalTime == '00:00') {
        this._setTime()
      }
      this._getMovableDis()
      this._bindBGMEvent()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // <movable-view> 拖动过程中触发的事件，event.detail = {x, y, source}
    onChange (event) {
      if (event.detail.source == 'touch') {
        // 此处没有通过 this.setData 进行赋值，所以不会同步到页面，只用于进行记录，用于减少 setData 操作
        this.data.progress = event.detail.x / (movableAreaWidth - movableViewWidth) * 100
        this.data.movableDis = event.detail.x
        isMoving = true
      }
    },
    // <movable-view> 拖动结束触发的事件
    onTouchEnd () {
      // 当前背景音频管理器播放的当前时间
      const currentTimeFmt = this._dateFormat(Math.floor(backgroundAudioManager.currentTime))
      this.setData({
        progress: this.data.progress,
        movableDis: this.data.movableDis,
        ['showTime.currentTime']: currentTimeFmt.min + ':' + currentTimeFmt.sec
      })
      // 背景音频跳转到指定位置
      backgroundAudioManager.seek(duration * this.data.progress / 100)
      isMoving = false
    },
    // 获取 <movable-view> <movable-view> 的宽度
    _getMovableDis () {
      const query = this.createSelectorQuery()
      query.select('.movable-area').boundingClientRect()
      query.select('.movable-view').boundingClientRect()
      query.exec((rect) => {
        movableAreaWidth = rect[0].width
        movableViewWidth - rect[1].width
      })
    },
    _bindBGMEvent () {
      backgroundAudioManager.onPlay(() => {
        // console.log('监听背景音频播放事件')
        // 当 <movable-view> bindtouchend="onTouchEnd" 中，将 当前进度条是否在拖拽标识（isMoving） 置为 false 时，
        // 仍然 <movable-view> bindchange="onChange" 偶尔会执行
        // 所以在 背景音频播放事件 中，将 isMoving 置为 false
        isMoving = false
        this.triggerEvent('musicPlay')
      })

      backgroundAudioManager.onStop(() => {
        // console.log('监听背景音频停止事件')
      })

      backgroundAudioManager.onPause(() => {
        // console.log('监听背景音频暂停事件')
        this.triggerEvent('musicPause')
      })

      backgroundAudioManager.onWaiting(() => {
        // console.log('监听音频加载中事件。当音频因为数据不足，需要停下来加载时会触发')
      })

      backgroundAudioManager.onCanplay(() => {
        // console.log('监听背景音频进入可播放状态事件。 但不保证后面可以流畅播放')
        // 当获取音频播放总时长为 undefined 时，重新进行获取
        if (typeof backgroundAudioManager.duration != 'undefined') {
          this._setTime()
        } else {
          setTimeout(() => {
            this._setTime()
          }, 1000)
        }
      })

      backgroundAudioManager.onTimeUpdate(() => {
        // console.log('监听背景音频播放进度更新事件，只有小程序在前台时会回调')
        if (!isMoving) {
          const currentTime = backgroundAudioManager.currentTime
          const duration = backgroundAudioManager.duration
          const sec = currentTime.toString().split('.')[0]
          // 音频当前时间精确到 xx.xxx 秒，为了减少 setData 次数，加入判断
          if (sec != currentSec) {
            const currentTimeFmt = this._dateFormat(currentTime)
            this.setData({
              movableDis: (movableAreaWidth - movableViewWidth) * currentTime / duration,
              progress: currentTime / duration * 100,
              ['showTime.currentTime']: `${currentTimeFmt.min}:${currentTimeFmt.sec}`,
            })
            currentSec = sec
            this.triggerEvent('timeUpdate', { currentTime }) // 联动歌词
          }
        }
      })

      backgroundAudioManager.onEnded(() => {
        // console.log("监听背景音频自然播放结束事件")
        this.triggerEvent('musicEnd')
      })

      backgroundAudioManager.onError((res) => {
        // console.log('监听背景音频播放错误事件')
        console.error(res.errMsg)
        console.error(res.errCode)
        wx.showToast({
          title: '错误:' + res.errCode,
        })
      })
    },
    _setTime () {
      duration = backgroundAudioManager.duration
      const durationFmt = this._dateFormat(duration)
      this.setData({
        ['showTime.totalTime']: `${durationFmt.min}:${durationFmt.sec}`
      })
    },
    // 格式化时间 参数sec，单位为 秒
    _dateFormat (sec) {
      const min = Math.floor(sec / 60) // 分钟
      sec = Math.floor(sec % 60)
      return {
        'min': this._parseZero(min),
        'sec': this._parseZero(sec)
      }
    },
    // 补零
    _parseZero (num) {
      return num < 10 ? '0' + num : num
    }
  }
})
