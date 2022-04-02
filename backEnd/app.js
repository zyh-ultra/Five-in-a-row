const Koa = require('koa');
const Router = require('koa-router'); 
const ws = require('ws');
const svgCaptcha = require('svg-captcha')

//实例化
const app = new Koa();
const router = new Router();
const wss = new ws.Server({port: 5051});

// 保存数据
let users = new Map();
let usersState = new Map();
let sockets = new Map();

// 验证码配置
const codeConfig = {
    size: 4, // 验证码长度
    ignoreChars: '0oO1ilI', // 验证码字符中排除 0oO1ilI
    noise: 2, // 干扰线条的数量
    width: 140,
    height: 45,
    fontSize: 50,
    // color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
    // background: '#eee',
};

//配置路由 
//ctx 上下文 context   req,res等信息都放在ctx里面
router.get('/', async (ctx)=> {
    ctx.body="看啥看！这就是个纯后端";//返回数据  原生里面的res.send()
})
// 判断当前用户名是否被使用
router.get('/canLogin/:username', async (ctx) => {
    // console.log(ctx.params.username)
    ctx.body = {canLogin: !users.has(ctx.params.username)}
    // ctx.body = ctx.params.username
})
// 获取验证码
router.get('/verif', async (ctx) => {
    let captcha = svgCaptcha.create(codeConfig);
    // console.log(captcha.text.toLowerCase())
    ctx.body = {svg: captcha.data, code: captcha.text.toLowerCase()};
})
// 获取当前的在线用户，及其状态{0: 在线空闲， 1：在房间中， 2:在对局}
router.get('/getUserList', async (ctx) => {
    let res = [];
    let keys = Array.from(usersState.keys());
    keys.map((val) => {
        res.push({user: val, info: usersState.get(val)});
    });
    ctx.body = JSON.stringify(res);
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
                if (users.has(wsmsg.username)) {
                    ws.send(JSON.stringify({type: "LoginError"}));
                }
                else {
                    users.set(wsmsg.username, ws);
                    usersState.set(wsmsg.username, {state: 0})
                    sockets.set(ws, wsmsg.username);
                }
                break;
            case "Invite":
                let userBInfo = usersState.get(wsmsg.to);
                if (userBInfo && userBInfo.state === 0) {
                    let wsB = users.get(wsmsg.to);
                    wsB.send(JSON.stringify({type: 'Invited', from: wsmsg.from}))
                }
                else {
                    ws.send(JSON.stringify({type: "InviteFail"}));
                }
                break;
            case "AcceptInvite":
                let userAInfo = usersState.get(wsmsg.to);
                if (userAInfo && userAInfo.state === 0) {
                    let wsA = users.get(wsmsg.to);
                    let userBInfo = usersState.get(wsmsg.from);
                    userAInfo.state = 1;
                    userBInfo.state = 1;
                    usersState.set(wsmsg.to, userAInfo);
                    usersState.set(wsmsg.from, userBInfo);
                    wsA.send(JSON.stringify({type: 'EnterRoom', rival: wsmsg.from}));
                    ws.send(JSON.stringify({type: "EnterRoom", rival: wsmsg.to}));
                }
                else {
                    ws.send(JSON.stringify({type:"InviteFail"}));
                }
                break;
            case "RefuseInvite":
                let wsA = users.get(wsmsg.to);
                wsA.send(JSON.stringify({type:"InviteFail"}));
                break;
            default:
                console.log(wsmsg)

        }
    });
    ws.on('close' ,function (e) {
        if (!sockets.has(ws)) return;
        let user = sockets.get(ws);
        sockets.delete(ws);
        users.delete(user);
        usersState.delete(user);
    });
})

//启动APP
app.listen(5050);