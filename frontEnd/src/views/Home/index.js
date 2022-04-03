import React, { Component } from 'react'
import {useNavigate} from "react-router-dom"
import {message, Spin, Modal, Layout, Row, Col, Avatar, Button, Input } from "antd"
import { IPCLOGINERROR, STARTINVITE } from '../../channel';
import Userlist from "../../components/Userlist"
import PubSub from "pubsub-js"
import { RetweetOutlined, UserOutlined  } from '@ant-design/icons';
import ChatCard from '../../components/CharCard';

const {Sider, Header, Content} = Layout

const withNavigation = (Component) => {
  return (props) => <Component {...props} navigate={useNavigate()} />;
};

class Home extends Component {
	constructor(props) {
		super(props);
		this.chatRef = React.createRef();
    let border = new Array(15).fill(0).map(() => {
      return new Array(15).fill(0);
    });
    this.state = {
      username: "",
      inviteSpining: false,
      rival: "",
      modalVisibility: false,
      inviter: "",
      preparing: false,
      order: 0,
      chattings: [],
      chatInput: "",
      border: border,
      myTurn: false
    }
	}

  

  render() {
    return (
      <div className="homeWrapper">
        <Layout style={{ height: "100%"}}> 
          <Layout>
            <Header style={{ backgroundColor: "white", paddingLeft: "5vw", paddingRight: "5vw"}}>
				<Row align="middle" justify="space-between">
					{
						this.state.rival === "" ? 
						<Col span={24}>
							<Spin spinning={this.state.inviteSpining} tip="inviting...">
								<Userlist></Userlist>
							</Spin>
						</Col> : 
						<>
							<Col span={8}>
								<Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} /> 对手：{this.state.rival}
							</Col>
							<Col span={10}>
								<Button style={{float: "right"}} type="primary" loading={this.state.preparing} onClick={this.onPrepareClick}>准备</Button>
								<Button style={{float: "right"}} type="primary" danger onClick={() => {this.ws.send(JSON.stringify({type:"Leave", from: this.state.username, to: this.state.rival}))}}>离开</Button>
							</Col>
						</>
					}
					
				</Row>  
            </Header>
            <Content style={{position: "relative"}}>
              <div style={{position: "absolute", top: "50%", left: "50%", transform:"translate(-50%, -50%)", width:"calc(90vmin - 64px)", height: "calc(90vmin - 64px)", backgroundColor:"gold"
            ,border: "2px solid", boxShadow: "-5px 10px 15px black"}}>
                <div style={{height: "100%", width: "100%", display: "grid", gridTemplateColumns: "repeat(15, 6.667%)", gridTemplateRow: "repeat(15, 6.667%)"}}>
                  {
                    this.state.border.reduce((res, row, i) => {
                      res.push(...row.map((item, j) => {
                        let classNames = ["checkerboard"];
                        if (i !== 0)
                          classNames.push('have-top');
                        if (i !== 14)
                          classNames.push("have-bottom");
                        if (j !== 0)
                          classNames.push("have-left");
                        if (j !== 14)
                          classNames.push("have-right");
                        let piece = "";
                        let func = function () {};
                        if (item === 0 && this.state.myTurn) {
                          piece = "piece hold-piece";
                          func = this.putPiece(i, j);
                        }
                        if (item === 1)
                          piece = "piece black-piece";
                        if (item === -1)
                          piece = "piece white-piece";
                        

                        return (
                          <div className={classNames.join(" ")} onClick={func} key={i + "-" + j}>
                            <div className="lefttop"></div>
                            <div className="righttop"></div>
                            <div className="leftbottom"></div>
                            <div className="rightbottom"></div>
                            <div className={piece}></div>
                          </div>
                        )
                      }));
                      return res;
                    }, [])
                  }
                </div>
              </div>
            </Content>
          </Layout>
		  <Sider width="300px" collapsible={true} reverseArrow={true} collapsedWidth={0} theme="light" breakpoint="md" trigger= {<RetweetOutlined />}>
			  <div className="chatContent" ref={this.chatRef}>
				  {
					  this.state.chattings.map((val, i) => <ChatCard key={i} kind={val.kind} content={val.content}></ChatCard>)
				  }
			  </div>
			  <Row style={{position: "absolute", bottom: "0px"}} justify="space-around">
				  <Col span={23}><Input value={this.state.chatInput} onChange={e => this.setState({chatInput: e.target.value})} onKeyDown={this.handleKeyDown}></Input></Col>
				  <Col span={1}><Button onClick={this.speakToRival} disabled={this.state.rival === ""}>发送</Button></Col>
			  </Row>
		  </Sider>
        </Layout>


        
        

        {/* 被邀请对话框 */}
        <Modal visible={this.state.modalVisibility} title={this.state.inviter + "邀请您加入对局"} closable={false} cancelText="拒绝" okText="同意"
        onCancel={this.modalCancel} onOk={this.modalOk} keyboard={false} maskClosable={false}>
        </Modal>
      </div>
    )
  }

  componentDidMount() {
    if (!window.username) {
      setTimeout(() => {
        message.error("please login first!")
        this.props.navigate('/');
      },  100);
      return;
    }
    this.setState({username: sessionStorage.getItem('username')})
    setTimeout(() => {
      this.connectBackEnd();
    }, 1);
    this.pubsub_invite = PubSub.subscribe(STARTINVITE, (msg, data) => {
      this.ws.send(JSON.stringify({from: this.state.username, to: data, type: "Invite"}));
      this.setState({inviteSpining: true});
    })
    
  }

  ws = null;
  componentWillUnmount() {
    this.connectCount = -1;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    PubSub.unsubscribe(this.pubsub_invite);
  }

  connectCount = 0;
  connectBackEnd = () => {
    if (this.state.username === "") return;
    if (this.ws) {
      this.ws.close();
    }
    this.ws = new WebSocket("ws://8.130.100.207:5051");
    window.ws = this.ws;
    this.ws.onopen = () => {
      this.connectCount++;
      this.ws.send(JSON.stringify({type: "Login", username: this.state.username}));
	  message.success("连接服务器成功！");
    }
    this.ws.onmessage = (e) => {
    //   console.log(e);
      let data = JSON.parse(e.data);
      let border;
      switch (data.type) {
        case "LoginError":
          this.connectCount = -1;
          sessionStorage.removeItem('username');
          window.username = undefined;
          this.ws.close();
          this.ws = null;
          this.props.navigate("/");
          message.error("Login Error, mayby the username has been used!")
          if (window.electron) {
            window.ipcRenderer.send(IPCLOGINERROR);
          }
          break;
        case "InviteFail":
          this.setState({inviteSpining: false});
          message.error("Invite Fail! 对方可能已经加入其他对局，或者对方拒绝")
          break;
        case "Invited":
          this.setState({modalVisibility: true, inviter: data.from});
          break;
        case "EnterRoom":
          this.setState({rival: data.rival, inviteSpining: false});
          message.success("成功加入房间，对手：" + data.rival);
          break;
        case "Leave":
          // 还原所有设置
          border = new Array(15).fill(0).map(() => {
            return new Array(15).fill(0);
          });
          this.setState({rival: "", inviter: "", preparing: false, chattings: [], chatInput: "", border: border, myTurn: false});
          message.error("对手已经离开房间！");
          break;
        case "Prepare":
          message.info(data.from + " is ready to play!");
          break;
        case "Start":
          border = new Array(15).fill(0).map(() => {
            return new Array(15).fill(0);
          });
          if (data.order === 1) {
            message.info("游戏开始，你的回合");
            this.setState({order: 1, myTurn: true, border:border});
          }
          else {
            message.info("游戏开始，对手回合");
            this.setState({order: -1, myTurn: false, border:border});
          }
          break;
        case "End":
          // 销毁preparing
          border = this.state.border;
          border[data.i][data.j] = data.order;
          this.setState({preparing: false, myTurn: false, border:border});
          message.error("对手落子" + data.i + '-' + data.j + ",你输了！");
          break;
        case "Speak":
          let chattings = this.state.chattings;
          chattings.push({kind: 1, content: data.content});
          //   console.log("Speak" + data.content);
          setTimeout(() => {
            this.chatRef.current.scrollTop = this.chatRef.current.scrollHeight;
          }, 100);
          this.setState({chattings: chattings});
          break;
        case "Process":
          border = this.state.border;
          border[data.i][data.j] = data.order;
          this.setState({border, myTurn: true});
          message.info("对手落子" + data.i + '-' + data.j + ",你的回合");
          break;
        default:
          console.log(data);
      }
    }
    this.ws.onclose = () => {
      if (this.connectCount < 0) {

      }
      else if (this.connectCount < 5) {
        this.connectBackEnd(this.state.username);
      }
      else {
        message.error("Can't connect to server!")
      }
    }
  }

  modalCancel = () => {
    this.setState({modalVisibility: false});
    this.ws.send(JSON.stringify({type:"RefuseInvite", to: this.state.inviter}));
  }

  modalOk = () => {
    this.setState({modalVisibility: false});
    this.ws.send(JSON.stringify({type:"AcceptInvite", to: this.state.inviter, from: this.state.username}));
  }

  onPrepareClick = () => {
	this.setState({preparing: true});
	this.ws.send(JSON.stringify({type: "Prepare", from: this.state.username, to: this.state.rival}));
  }

  speakToRival = () => {
	  let {chatInput, chattings} = this.state;
	  chattings.push({kind: 0, content: chatInput});
	  this.setState({chatInput: "", chattings});
	this.ws.send(JSON.stringify({type:"Speak", to: this.state.rival, msg: chatInput}));
	setTimeout(() => {
		this.chatRef.current.scrollTop = this.chatRef.current.scrollHeight;
	}, 100);
  }

  handleKeyDown = (event) => {
	  if (event.keyCode === 13)
	  	this.speakToRival();
  }

  putPiece = (i, j) => {
    return () => {
      let {border, order, username, rival} = this.state;
      border[i][j] = order;
      this.setState({border: border, myTurn: false});
      if (this.checkIsWin(border, i, j, order)) {
        message.success("你赢啦！");
        this.setState({preparing: false});
        this.ws.send(JSON.stringify({type: "End", from: username, to: rival, i: i, j: j, order: order}))
      }
      else {
        this.ws.send(JSON.stringify({type:"Process", from: username, to: rival, i: i, j: j, order: order}));
      }
    }
  }

  checkIsWin = (border, i, j, order) => {
    let direction = [[1, 0], [0, 1], [1, 1], [-1, 1]]; // 四方向判断
    for (let m = 0; m < direction.length; m++) {
      if (this.getNumbers(border, i, j, order, direction[m]) >= 5) {
        return true;
      }
    }
    return false;
  }

  getNumbers = (border, i, j, order, direction) => {
    let count = 1;
    let tempI = i + direction[0];
    let tempJ = j + direction[1];
    while (tempI >= 0 && tempI < 15 && tempJ >= 0 && tempJ < 15 && border[tempI][tempJ] === order) {
      count++;
      tempI += direction[0];
      tempJ += direction[1];
    }
    tempI = i - direction[0];
    tempJ = j - direction[1];
    while (tempI >= 0 && tempI < 15 && tempJ >= 0 && tempJ < 15 && border[tempI][tempJ] === order) {
      count++;
      tempI -= direction[0];
      tempJ -= direction[1];
    }
    return count;
  }

}

export default withNavigation(Home);
