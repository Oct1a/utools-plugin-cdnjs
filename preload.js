const { clipboard } = require('electron');
const request = require('request');

let Resourse = [] //全部资源
let versionAll = [] //全部版本
let detailAll = [] //详情
let keyword = "" //用户搜索的关键词
  // let temp_keyword = ''
  // 写入剪切板
const handleResult = function(data) {
  if (data) {
    clipboard.writeText(data, 'selection');
  }
};

// 发起请求
const getRequestBody = (url) => {
  return new Promise((resolve, reject) => {
    request.get(url, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        resolve(JSON.parse(body))
      } else {
        reject(err)
      }
    })
  })
}

// 获取推荐
const getALLResourse = async(callbackSetList) => {
  let list = await getRequestBody('https://api.cdnjs.com/libraries').catch(e => {
    callbackSetList([{
      title: "查询错误，请检查网络是否正常",
      description: "查询结果为空",
      icon: './logo.png'
    }])
  })
  for (const item of list.results) {
    Resourse.push({
      title: item.name,
      description: item.latest
    })
  }
  callbackSetList(Resourse.slice(0, 30))
}

// 获取所有版本号
const getLibVersion = async(key, callbackSetList) => {
  detailAll = await getRequestBody(`https://api.cdnjs.com/libraries/${key}`).catch(e => {
    callbackSetList([{
      title: "查询错误，请检查网络是否正常",
      description: "查询结果为空",
      icon: './logo.png'
    }])
  })
  detailAll.versions.forEach(v => {
    versionAll.push({
      title: v
    })
  });
  callbackSetList(versionAll.reverse())
}

// 获取CDN地址
const getLibCDN = (version, callbackSetList) => {
  let v = detailAll.assets.filter(item => item.version === version)
  let files = []
  for (const file of v[0].files) {
    files.push({
      title: file,
      description: `https://cdnjs.cloudflare.com/ajax/libs/${keyword}/${version}/${file}`
    })
  }
  callbackSetList(files)
}
window.exports = {
  "cdnjs": {
    mode: "list",
    args: {
      enter: (action, callbackSetList) => {
        getALLResourse(callbackSetList)
      },
      search: (action, searchWord, callbackSetList) => {
        if (searchWord) {
          // temp_keyword = searchWord
          // 判断用户输入
          if (searchWord.endsWith('@')) {
            keyword = searchWord.slice(0, searchWord.lastIndexOf('@'))
            let version = searchWord.slice(searchWord.lastIndexOf('@') + 1, searchWord.length)
            getLibVersion(keyword, callbackSetList)
          } else if (searchWord.includes('@')) {
            let version = searchWord.slice(searchWord.lastIndexOf('@') + 1, searchWord.length)
            callbackSetList(versionAll.filter(v => v.title.startsWith(version)))
          } else {
            let list = Resourse.filter(v => v.title.indexOf(searchWord) != -1)
            callbackSetList(list)
          }
        }
      },
      // 用户选择列表中某个条目时被调用
      select: (action, itemData, callbackSetList) => {
        if (itemData.description) {
          window.utools.hideMainWindow()
          handleResult(itemData.description)
          window.utools.outPlugin()
        } else {
          // utools.setSubInputValue(temp_keyword + itemData.title) //设置输入框内容
          // 点击了版本号,获取下载地址
          getLibCDN(itemData.title, callbackSetList)
        }
      },
      placeholder: "输入关键词，如：Vue、React、Jquery，指定版本号加@"
    }
  }
}