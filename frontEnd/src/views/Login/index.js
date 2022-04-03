import React, { Component } from 'react';
import {Input, Button, Divider, Row, Col, message} from "antd"
import { UserOutlined, VerifiedOutlined } from '@ant-design/icons'
import axios from "axios"
import {IPCLOGINSUCCESS} from '../../channel'
import {useNavigate} from "react-router-dom"


const withNavigation = (Component) => {
  return (props) => <Component {...props} navigate={useNavigate()} />;
};

class Login extends Component {
  constructor(props) {
    super(props);
    this.svgref = React.createRef();
  }

  state =  {
    verifyCode: "",
    username: "",
    canLogin: false,
    inputCode: "",
  }

  render() {
    return (
      <div className="loginWrapper">
        <h1>五子棋</h1>
        <Divider>登录</Divider>
        <Row className="loginRow" justify="space-around">
          <Col span={24}>
            <Input value={this.state.username} onChange={this.onUsernameChange} placeholder="输入用户名" prefix={<UserOutlined />}
            status={this.state.canLogin ? "success" : "error"}></Input>
          </Col>
        </Row>
        <Row className="loginRow" justify="space-between" align="middle">
          <Col span={11}>
            <Input value={this.state.inputCode} onChange={(e) => this.setState({ inputCode: e.target.value })} placeholder="输入验证码" prefix={<VerifiedOutlined />}
            status={this.state.inputCode.toLocaleLowerCase() === this.state.verifyCode ? "success" : "error"}></Input>
          </Col>
          <Col span={11}><a  onClick={this.getVerif} ref={this.svgref}></a></Col>
        </Row>
        <Row className="loginRow" justify="center">
          <Button onClick={this.login} disabled={(!this.state.canLogin) || (this.state.inputCode.toLocaleLowerCase() !== this.state.verifyCode)}>登录</Button>
        </Row>
        
        
      </div>
    )
  }

  componentDidMount() {
    this.getVerif();
    if (window.ws) {
      window.ws.close();
    }
  }

  login = () =>{
    // console.log("login")
    sessionStorage.setItem("username", this.state.username);
    window.username = this.state.username;
    this.props.navigate('/home')
    if (window.electron) {
      window.ipcRenderer.send(IPCLOGINSUCCESS)
    }
  }

  getVerif = () => {
    axios.get("http://8.130.100.207:5050/verif?t=" + Math.random())
    .then((response) => {
      this.setState({verifyCode: response.data.code})
      this.svgref.current.innerHTML = response.data.svg;
    })
    .catch((error) => {
      console.log(error);
    })
  }

  onUsernameChange = (e) => {
    this.setState({username: e.target.value});
    this.debounce();
  }

  isUsernameEnabled = () => {
    if (this.state.username === "") {
      this.setState({canLogin: false});
      return;
    }
    axios.get("http://8.130.100.207:5050/canLogin/" + this.state.username)
    .then((response) => {
      this.setState({canLogin: response.data.canLogin});
      if (!response.data.canLogin) {
        message.error(this.state.username + ' has been used!')
      }
    })
    .catch((error) => {
      console.log(error)
    });
    // console.log("isUsernameEnabled")
  }

  timer = null;
  debounce = () => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.isUsernameEnabled();
      }, 100);
  }

}

export default withNavigation(Login);