// 获取web服务实例
var app = Express();
// 获取日志实例
var logs = Logger();
// 获取傻妞实例
var sillyGirl = SillyGirl();

var buckets = ["wx", "qq", "jd_cookie", "sillyGirl", "fanlivip", "otto", "reply", "wxsv", "qinglong", "wxmp", "tg", "pinQQ", "pinWX", "pinWXMP", "pinTG"];

// 首页
app.get("/", (req, res) => {
     // res.setCookie("name", "value")
     // 渲染模版
     res.render(
          "hello.html",// 模版文件目录 /etc/sillyGirl/views
          {
               title: "世界，你好。", data: {
                    text: "Hello world!",
                    image: "assets/test.jpeg",// 静态文件目录 /etc/sillyGirl/assets
               }
          }
     )

     // 页面提示404
     // res.status(404).send("页面找不到了")

     // 跳转指定网页
     // res.redirect("https://github.com/cdle/sillyGirl")
})

// 响应普通文本
app.get('/text', (req, res) => {
     res.send('这是一段普通的文字。')
})

// 获取请求的json数据，响应json数据
app.post('/json', (req, res) => {
     var data = req.json()
     res.json(data)
})

// 获取url中的参数
app.get('/query', (req, res) => {
     var name = req.query("name")
     res.send(`你好，${name}！`)
     // 三种类型日志输出
     logs.Info(`%s，访问了 ${req.path()} 接口`, name)
     logs.Warn(`%s，访问了 ${req.path()} 接口`, name)
     logs.Debug(`%s，访问了 ${req.path()} 接口`, name)
})

// 获取表单数据
app.post('/post', (req, res) => {
     var name = req.postForm("name")
     var message = req.postForm("message")
     logs.Info(`%s，访问了 ${req.path()} 接口`, message)
     res.send(`你好，${name}！`)
})

// 推送私聊消息
app.get('/sendPrivateMsg', (req, res) => {
     sillyGirl.push({
          imType: "tg",
          userID: "1837585653",
          content: "你的大香蕉成熟了，请快到app领取。"
     })
})

// 推送群聊消息
app.post('/sendGroupMsg', (req, res) => {
     sillyGirl.push({
          imType: "tg",
          groupCode: -1001583071436,
          content: "该喝开水啦。"
     })
})

// 数据存储
app.get('/lastTime', (req, res) => {
     var bucket = "test"
     var keyname = "lastTime"
     var lastTime = sillyGirl.bucketGet(bucket, keyname)
     res.send(lastTime)
     sillyGirl.bucketSet(bucket, keyname, `访问地址：${req.ip()} + \n日期时间：${(new Date()).toLocaleString()}`)
})

// 检查Cookie
function checkCookie(req, res, func) {
     var webpwdStore = sillyGirl.bucketGet("sillyGirl", "webpwd")
     if (webpwdStore == "") {
          webpwdStore = "sillyGirl"
     }
     if (req.cookie("webpwd") != webpwdStore) {
          res.render(
               "login.html",// 模版文件目录 /etc/sillyGirl/views
               {
                    title: "傻妞后台管理", data: {
                         help1: "使用set sillyGirl webpwd ? 设置",
                         help2: "未登录，请登录后使用。"
                    }
               }
          )
          return
     }
     func()
}

// 登录页
app.get("/admin", (req, res) => {
     res.render(
          "login.html",// 模版文件目录 /etc/sillyGirl/views
          {
               title: "傻妞后台管理", data: {
                    help1: "使用set sillyGirl webpwd ? 设置",
                    help2: "默认：sillyGirl"
               }
          }
     )
})

// 登录请求
app.post("/login", (req, res) => {
     var webpwd = req.postForm("password")
     var webpwdStore = sillyGirl.bucketGet("sillyGirl", "webpwd")
     if (webpwdStore == "") {
          webpwdStore = "sillyGirl"
     }
     if (webpwd != webpwdStore) {
          res.render(
               "login.html",// 模版文件目录 /etc/sillyGirl/views
               {
                    title: "傻妞后台管理", data: {
                         help1: "使用set sillyGirl webpwd ? 设置",
                         help2: "密码不正确！"
                    }
               }
          )
          return
     }

     res.setCookie("webpwd", webpwd)
     res.redirect("/manage")
})

// 管理页
app.get("/manage", (req, res) => {
     checkCookie(req, res, function() {
          // 渲染模版
          res.render(
               "manage.html",// 模版文件目录 /etc/sillyGirl/views
               {}
          )
     })
})

// 新增的下拉菜单
app.get('/options', (req, res) => {
     checkCookie(req, res, function() {
          var options = [];
          
          for (var bucket of buckets) {
               options.push({
                    label: bucket,
                    value: bucket
               });
          }

          var data = {
               status: 0,
               msg: "",
               data: {
                    options: options
               }
          }

          res.json(data)
     })
})

// 获取所有存储桶数据
app.get('/datas', (req, res) => {
     checkCookie(req, res, function() {
          var bucketQ = req.query("bucket")
          var idQ = req.query("id")
          var valueQ = req.query("value")
          var rows = [];
          for (var bucket of buckets) {
               var keys = sillyGirl.bucketKeys(bucket)
               for (var key of keys) {
                    rows.push({
                         bucket: bucket,
                         id: key,
                         value: sillyGirl.bucketGet(bucket, key)
                    });
               }
          }

          var ret = []

          for (var row of rows) {
               if (bucketQ && row.bucket.indexOf(bucketQ) == -1) {
                    continue;
               }
               if (idQ && row.id.indexOf(idQ) == -1) {
                    continue;
               }
               if (valueQ && row.value.indexOf(valueQ) == -1) {
                    continue;
               }
               ret.push(row);
          }

          var data = {
               status: 0,
               msg: "ok",
               data: {
                    count: ret.length,
                    rows: ret
               }
          }

          res.json(data)
     })
})

// 删除单个键
app.delete('/datas', (req, res) => {
     checkCookie(req, res, function() {
          var bucketQ = req.query("bucket")
          var idQ = req.query("id")
          sillyGirl.bucketSet(bucketQ, idQ, null)

          res.json({
               status: 0,
               msg: "删除操作完成"
          })
     })
})

// 新增或修改单个键
app.post('/datas', (req, res) => {
     checkCookie(req, res, function() {
          var data = req.json()
          var bucket = data.bucket
          var key = data.id
          var value = data.value

          sillyGirl.bucketSet(bucket, key, value)

          var data = {
               status: 0,
               msg: "新增/修改成功"
          }

          res.json(data)
     })
})

// 批量修改键
app.post('/bulkUpdate', (req, res) => {
     checkCookie(req, res, function() {
          var data = req.json()
          var rows = data.rows

          for (var row of rows) {
               sillyGirl.bucketSet(row.bucket, row.id, row.value)
          }

          var ret = {
               status: 0,
               msg: "更新成功"
          }

          res.json(ret)
     })
})
