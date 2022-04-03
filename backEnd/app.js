const Koa = require('koa');
const Router = require('koa-router'); 
const ws = require('ws');
const svgCaptcha = require('svg-captcha');
const cors = require('koa2-cors');

//实例化
const app = new Koa();
const router = new Router();
const wss = new ws.Server({port: 5051});

// 保存数据
let users = new Map();
let usersState = new Map();
let sockets = new Map();
let prepares = new Map();

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
app.use(cors());
app.use(router.routes()); 
app.use(router.allowedMethods()); 

// wss配置
wss.on('connection', function connect(ws, req) {
    ws.on("message", function (msg) {
        let wsmsg = JSON.parse(msg);
        let userAInfo, userBInfo, wsA, wsB; 
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
                userBInfo = usersState.get(wsmsg.to);
                if (userBInfo && userBInfo.state === 0) {
                    wsB = users.get(wsmsg.to);
                    wsB.send(JSON.stringify({type: 'Invited', from: wsmsg.from}))
                }
                else {
                    ws.send(JSON.stringify({type: "InviteFail"}));
                }
                break;
            case "AcceptInvite":
                userAInfo = usersState.get(wsmsg.to);
                if (userAInfo && userAInfo.state === 0) {
                    wsA = users.get(wsmsg.to);
                    userBInfo = usersState.get(wsmsg.from);
                    userAInfo.state = 1;
                    userBInfo.state = 1;
                    userAInfo.rival = wsmsg.from;
                    userBInfo.rival = wsmsg.to;
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
                wsA = users.get(wsmsg.to);
                wsA.send(JSON.stringify({type:"InviteFail"}));
                break;
            case "Leave":
                console.log("Leave -- ")
                userAInfo = usersState.get(wsmsg.from);
                userBInfo = usersState.get(wsmsg.to);
                wsB = users.get(wsmsg.to);
                userAInfo.state = 0;
                userBInfo.state = 0;
                delete userAInfo['rival'];
                delete userBInfo['rival'];
                usersState.set(wsmsg.from, userAInfo);
                usersState.set(wsmsg.to, userBInfo);
                prepares.delete(wsmsg.from);
                prepares.delete(wsmsg.to);
                wsB.send(JSON.stringify({type: "Leave"}));
                ws.send(JSON.stringify({type: "Leave"}));
                break;
            case "Prepare":
                wsA = users.get(wsmsg.to);
                if (prepares.has(wsmsg.to)) {
                    prepares.delete(wsmsg.to);
                    userAInfo = usersState.get(wsmsg.to);
                    userBInfo = usersState.get(wsmsg.from);
                    userAInfo.state = 2;
                    userBInfo.state = 2;
                    usersState.set(wsmsg.to, userAInfo);
                    usersState.set(wsmsg.from, userBInfo);
                    wsA.send(JSON.stringify({type: "Start", order: 1}));
                    ws.send(JSON.stringify({type: "Start", order: -1}));
                }
                else {
                    prepares.set(wsmsg.from, 0);
                    wsA.send(JSON.stringify({type: "Prepare", from: wsmsg.from}));
                }
                break;
            case "Speak":
                wsA = users.get(wsmsg.to);
                wsA.send(JSON.stringify({type:"Speak", content: wsmsg.msg}));
                break;
            case "Process":
            case "End":
            case "Surrender":
                wsA = users.get(wsmsg.to);
                wsA.send(JSON.stringify(wsmsg));
                break;
            default:
                console.log(wsmsg)

        }
    });
    ws.on('close' ,function (e) {
        if (!sockets.has(ws)) return;
        let user = sockets.get(ws);
        let userInfo = usersState.get(user);
        if (userInfo.state !== 0) {
            if (userInfo.rival !== "") {
                let wsRival = users.get(userInfo.rival);
                 if (wsRival) {
                    wsRival.send(JSON.stringify({type: "Leave"}));
                    let stateRival = usersState.get(userInfo.rival);
                    stateRival.state = 0;
                    delete stateRival['rival'];
                    usersState.set(userInfo.rival, stateRival);
                }
                prepares.delete(userInfo.rival);
            }
            // console.log(user, userInfo.rival, "leave")    
            prepares.delete(user);      
        }
        sockets.delete(ws);
        users.delete(user);
        usersState.delete(user);
    });
})

//启动APP
app.listen(5050);