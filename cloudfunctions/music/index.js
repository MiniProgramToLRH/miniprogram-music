// 云函数入口文件
const cloud = require('wx-server-sdk')

// 一个用户在一个云环境中只能创建50个函数
// 相同的请求可以归类到同一个云函数中处理，可以使用 tab-router云函数路由库
const TcbRouter = require('tcb-router')
const rp = require('request-promise')
const BASE_URL = 'http://musicapi.xiecheng.live'

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event })

  app.router('playlist', async (ctx, next) => {
    ctx.body = await cloud.database().collection('playlist')
      .skip(event.start)
      .limit(event.count)
      .orderBy('createTime', 'desc')
      .get()
      .then((res) => { return res })
  })

  app.router('musiclist', async (ctx, next) => {
    ctx.body = await rp(BASE_URL + '/playlist/detail?id=' + parseInt(event.playlistId))
      .then((res) => {
        return JSON.parse(res)
      })
  })

  app.router('musicUrl', async (ctx, next) => {
    ctx.body = await rp(BASE_URL + '/song/url?id=' + event.musicId)
      .then((res) => {
        return res
      })
  })

  app.router('lyric', async(ctx, next) => {
    ctx.body = await rp(BASE_URL + `/lyric?id=${event.musicId}`).then((res) => {
      return res
    })
  })

  return app.serve()
}