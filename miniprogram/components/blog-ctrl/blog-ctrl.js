let userInfo = {}
const db = wx.cloud.database()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    blogId: String,
    blog: Object
  },

  externalClasses: ['iconfont', 'icon-pinglun', 'icon-fenxiang'],

  /**
   * 组件的初始数据
   */
  data: {
    loginShow: false, // 控制登陆组件是否显示
    modalShow: false, // 控制底部弹出层是否显示
    content: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onComment () {
      // 判断用户是否授权
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: (res) => {
                userInfo = res.userInfo
                this.setData({ modalShow: true })
              }
            })
          } else {
            this.setData({ loginShow: true })
          }
        }
      })
    },

    onLoginsuccess (event) {
      userInfo = event.detail
      // 授权框消失，显示评论框
      this.setData({
        loginShow: false
      }, () => {
        this.setData({ modalShow: true })
      })
    },

    onLoginfail () {
      wx.showModal({
        title: '授权用户才能进行评价',
        content: ''
      })
    },

    onSend (event) {
      let formId = event.detail.formId
      let content = event.detail.value.content
      if (content.trim() === '') {
        wx.showModal({
          title: '评论内容不能为空',
          content: ''
        })
        return
      }
      wx.showLoading({
        title: '评价中',
        mask: true
      })
      db.collection('blog-comment').add({
        data: {
          content,
          blogId: this.properties.blogId,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createTime: db.serverDate()
        }
      }).then((res) => {
        wx.cloud.callFunction({
          name: 'sendMessage',
          data: {
            content,
            formId,
            blogId: this.properties.blogId
          }
        }).then((res) => {
          console.log('消息推送成功 res：', res)
        }).catch((err) => {
          console.log('消息推送失败 err', err)
        })
        wx.hideLoading()
        wx.showToast({ title: '评价成功' })
        this.setData({
          modalShow: false,
          content: ''
        })
        this.triggerEvent('refreshCommentList')
      })
    }
  }
})
