let musiclist = [] // 播放列表
let nowPlayingIndex = 0 // 正在播放歌曲的index
// 获取全局唯一的背景音频管理器
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    picUrl: '', // 播放歌曲图片
    lyric: '', // 歌词
    isPlaying: false, // 是否处于播放状态：true - 表示正在播放
    isLyricShow: false, // 是否显示歌词
    isSame: false // 是否为同一首歌
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    nowPlayingIndex = options.index
    musiclist = wx.getStorageSync('musiclist')
    this._loadMusicDetail(options.musicId)
  },

  _loadMusicDetail (musicId) {
    // 判断是否为同一歌曲
    if (musicId == app.getPlayMusicId()) {
      this.setData({ isSame: true })
    } else {
      this.setData({ isSame: false })
    }
    if (!this.data.isSame) {
      // 如果不为用一首歌，则先暂停，再进行播放
      backgroundAudioManager.stop()
    }
    let music = musiclist[nowPlayingIndex]
    wx.setNavigationBarTitle({
      title: music.name
    })
    this.setData({
      picUrl: music.al.picUrl,
      isPlaying: false
    })
    app.setPlayMusicId(musicId)
    wx.showLoading({
      title: '歌曲加载中'
    })
    wx.cloud.callFunction({
      name: 'music',
      data: {
        musicId,
        $url: 'musicUrl'
      }
    }).then((res) => {
      let result = JSON.parse(res.result)
      if (result.data[0].url == null) {
        wx.showToast({ title: '无权限播放' })
        return
      }
      if (!this.data.isSame) {
        backgroundAudioManager.src = result.data[0].url
        backgroundAudioManager.title = music.name
        backgroundAudioManager.coverImgUrl = music.al.picUrl
        backgroundAudioManager.singer = music.ar[0].name
        backgroundAudioManager.epname = music.al.name
        this.savePlayHistory() // 保存播放历史
      }
      this.setData({ isPlaying: true })
      wx.hideLoading()
      // 加载歌词
      wx.cloud.callFunction({
        name: 'music',
        data: {
          musicId,
          $url: 'lyric'
        }
      }).then((res) => {
        let lyric = '暂无歌词'
        const lrc = JSON.parse(res.result).lrc
        if (lrc) { lyric = lrc.lyric }
        this.setData({ lyric })
      })
    })
  },

  // 播放 / 暂停
  togglePlaying () {
    if (this.data.isPlaying) {
      backgroundAudioManager.pause()
    } else {
      backgroundAudioManager.play()
    }
    this.setData({
      isPlaying: !this.data.isPlaying
    })
  },

  // 上一首
  onPrev () {
    nowPlayingIndex--
    if (nowPlayingIndex < 0) {
      nowPlayingIndex = musiclist.length - 1
    }
    this._loadMusicDetail(musiclist[nowPlayingIndex].id)
  },

  // 下一首
  onNext () {
    nowPlayingIndex++
    if (nowPlayingIndex === musiclist.length) {
      nowPlayingIndex = 0
    }
    this._loadMusicDetail(musiclist[nowPlayingIndex].id)
  },

  // 控制歌词的显示 / 隐藏
  onChangeLyricShow () {
    this.setData({ isLyricShow: !this.data.isLyricShow })
  },

  timeUpdate (event) {
    // 获取 <x-lyric> 组件，调用组件中 update 方法
    this.selectComponent('.lyric').update(event.detail.currentTime)
  },

  // 播放
  onPlay () {
    this.setData({ isPlaying: true })
  },

  // 暂停
  onPause () {
    this.setData({ isPlaying: false })
  },

  // 保存播放历史
  savePlayHistory () {
    const music = musiclist[nowPlayingIndex]
    const openid = app.globalData.openid
    const history = wx.getStorageSync(openid)
    let bHave = false
    for (let i = 0, len = history.length; i < len; i++) {
      if (history[i].id == music.id) {
        bHave = true
        break
      }
    }
    if (!bHave) {
      history.unshift(music)
      wx.setStorage({
        key: openid,
        data: history
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})