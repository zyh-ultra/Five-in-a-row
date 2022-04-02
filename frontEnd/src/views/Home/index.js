import React, { Component } from 'react'
import {useNavigate} from "react-router-dom"
import {message, Spin, Modal } from "antd"
import { IPCLOGINERROR, STARTINVITE } from '../../channel';
import Userlist from "../../components/Userlist"
import PubSub from "pubsub-js"

const withNavigation = (Component) => {
  return (props) => <Component {...props} navigate={useNavigate()} />;
};

class Home extends Component {
  state = {
    username: "",
    inviteSpining: false,
    rival: "",
    modalVisibility: false,
    inviter: "",
  }

  render() {
    return (
      <div>
        Home {this.state.username} rival: {this.state.rival}
        <Spin spinning={this.state.inviteSpining} tip="inviting...">
          <Userlist></Userlist>
        </Spin>
        

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
    }
    this.ws.onmessage = (e) => {
      console.log(e);
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

}

export default withNavigation(Home);
