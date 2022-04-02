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
	}

  state = {
    username: "",
    inviteSpining: false,
    rival: "",
    modalVisibility: false,
    inviter: "",
	preparing: false,
	order: 0,
	chattings: [],
	chatInput: "",
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
								<Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} /> {this.state.rival}
							</Col>
							<Col span={10}>
								<Button style={{float: "right"}} type="primary" loading={this.state.preparing} onClick={this.onPrepareClick}>准备</Button>
								<Button style={{float: "right"}} type="primary" danger onClick={() => {this.ws.send(JSON.stringify({type:"Leave", from: this.state.username, to: this.state.rival}))}}>离开</Button>
							</Col>
						</>
					}
					
				</Row>  
            </Header>
            <Content>

            </Content>
          </Layout>
		  <Sider width="300px" collapsible={true} reverseArrow={true} collapsedWidth={0} theme="light" breakpoint="md" trigger= {<RetweetOutlined />}>
			  <div className="chatContent" ref={this.chatRef}>
				  {
					  this.state.chattings.map((val, i) => <ChatCard key={i} kind={val.kind} content={val.content}></ChatCard>)
				  }
			  </div>
			  <Row style={{position: "absolute", bottom: "0px"}}>
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
    this.ws = new WebSocket("ws://localhost:5051");
    window.ws = this.ws;
    this.ws.onopen = () => {
      this.connectCount++;
      this.ws.send(JSON.stringify({type: "Login", username: this.state.username}));
	  message.success("连接服务器成功！");
    }
    this.ws.onmessage = (e) => {
    //   console.log(e);
      let data = JSON.parse(e.data);
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
		  this.setState({rival: "", inviter: "", preparing: false, chattings: [], chatInput: ""});
		  console.log("Leave");
		  break;
		case "Prepare":
		  message.info(data.from + " is ready to play!");
		  break;
		case "Start":
		  message.info("order" + data.order);
		  break;
		case "End":
		  // 销毁棋盘和preparing
		  this.setState({preparing: false});
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

}

export default withNavigation(Home);
