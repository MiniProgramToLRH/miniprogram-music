// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise')

cloud.init()

const db = cloud.database() // 获取数据库实例
const playlistCollection = db.collection('playlist') // 获取 playlist集合 的引用
const URL = 'http://musicapi.xiecheng.live/personalized'
const MAX_LIMIT = 100



// 云函数入口函数
exports.main = async (event, context) => {

  // 在获取集合数据时服务器一次默认并且最多返回的记录数目
  // >>> 小程序端 20 条记录
  // >>> 云函数端 100 条记录
  // 以下为突破限制方法：
  const countResult = await playlistCollection.count() // 统计匹配查询条件的记录的条数,此处即为获取 playlist集合 中数据的条数
  const total = countResult.total // playlist集合 中数据的条数
  const batchTimes = Math.ceil(total / MAX_LIMIT) // 需要获取次数
  const tasks = [] // 任务数组
  for (let i = 0; i < batchTimes; i++) {
    let promise = playlistCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  let list = { data: [] } // 云函数端数据记录集合
  if (tasks.length > 0) {
    list = (await Promise.all(tasks)).reduce((acc, cur) => {
      return { data: acc.data.concat(cur.data) }
    })
  }

  const playlist = await rp(URL).then((res) => {
    return JSON.parse(res).result
  }) // 云端数据获取记录
  const newData = [] // 最新记录数据
  // 通过双层 for循环 筛选最新数据
  for (let i = 0, len1 = playlist.length; i < len1; i++) {
    let flag = true
    for (let j = 0, len2 = list.data.length; j < len2; j++) {
      if (playlist[i].id === list.data[j].id) {
        flag = false
        break;
      }
    }
    if (flag) {
      newData.push(playlist[i])
    }
  }
  for (let i = 0, len = newData.length; i < len; i++) {
    // 数据库集合引用 - 新增记录(add)
    await playlistCollection.add({
      data: { 
        ...newData[i],
        createTime: db.serverDate() // 服务器时间
      }
    }).then((res) => {
      console.log('插入成功！')
    }).catch((err) => {
      console.log('插入失败')
    })
  }

  return newData.length
}