import React, { Component } from 'react'
import {useNavigate} from "react-router-dom"
import {message} from "antd"
import { IPCLOGINERROR } from '../../channel';

const withNavigation = (Component) => {
  return (props) => <Component {...props} navigate={useNavigate()} />;
};

class Home extends Component {
  state = {

  }

  render() {
    return (
      <div>Home</div>
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
    this.username = sessionStorage.getItem('username');
    this.connectBackEnd();
    
  }

  componentWillUnmount() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  connectCount = 0;
  connectBackEnd = () => {
    this.ws = new WebSocket("ws://localhost:5051");
    this.ws.onopen = () => {
      this.connectCount++;
      this.ws.send(JSON.stringify({type: "Login", username: this.username}));
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
        
        default:
          console.log(data);
      }
    }
    this.ws.onclose = () => {
      if (this.connectCount == -1) {

      }
      else if (this.connectCount < 5) {
        this.connectBackEnd(this.username);
      }
      else {
        message.error("Can't connect to server!")
      }
    }
  }
}

export default withNavigation(Home);
