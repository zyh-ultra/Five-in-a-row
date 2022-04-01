const Koa = require('koa');
const Router = require('koa-router'); 
const ws = require('ws');

//实例化
const app = new Koa();
const router = new Router();
const wss = new ws.Server({port: 5051});

// 保存数据
let users = [];
let sockets = new Map();

//配置路由 
//ctx 上下文 context   req,res等信息都放在ctx里面
router.get('/', async (ctx)=> {
    ctx.body="看啥看！这就是个纯后端";//返回数据  原生里面的res.send()
})

router.get('/canLogin/:username', async (ctx) => {
    ctx.body = {canLogin: users.indexOf(ctx.params.username) == -1}
    // ctx.body = ctx.params.username
})

//启动路由
app.use(router.routes()); 
app.use(router.allowedMethods()); 

// wss配置
wss.on('connection', function connect(ws, req) {
    ws.on("message", function (msg) {
        let wsmsg = JSON.parse(msg); 
        switch (wsmsg.type) {
            case "Login":
                sockets.set(wsmsg.username, ws);
                users.push(wsmsg.username)
                // console.log(wsmsg.username)
                break;
            case "Logout":
                sockets.delete(wsmsg.username);
                let index = users.indexOf(wsmsg.username);
                if (index != -1)
                    users.splice(index, 1)
                console.log(wsmsg.username)
                break;
            default:
                console.log(wsmsg)

        }
    });
    ws.on("open", function(e) {
        console.log("open", e);
    });
    ws.on('close' ,function (e) {
        console.log(e);
        console.log("close");
    });
    ws.on("error", function(e) {
        console.log(e);
        console.log("error")
    });
})

//启动APP
app.listen(5050);