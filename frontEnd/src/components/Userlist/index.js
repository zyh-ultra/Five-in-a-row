import React, { Component } from 'react'
import { RedoOutlined, UserAddOutlined } from '@ant-design/icons';
import { Select, Button } from "antd"
import axios from "axios"
import PubSub from "pubsub-js"
import {STARTINVITE} from "../../channel"
const {Option} = Select;

export default class Userlist extends Component {
    state = {
        userList: [],
        selectedUser: "",
    }

  render() {
    return (
      <div>
        
        <Select className="userlistSelect" showSearch placeholder="Select a person" optionFilterProp="children"
            filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            value={this.state.selectedUser} onChange={(value) => this.setState({ selectedUser: value})}
        >
            {this.state.userList.map((user) => {
                if (user.user === window.username) return;
                let color, text, disabled = true;
                switch (user.info.state) {
                    case 0:
                        color = "green";
                        disabled = false;
                        break;
                    case 1:
                        color = "volcano";
                        break;
                    case 2:
                        color = "red";
                        break;
                }
                return (
                    <Option key={user.user} style={{color: color}} value={user.user} disabled={disabled}>{user.user}</Option> 
                )
            })}
        </Select>
        <Button onClick={this.getUserList}><RedoOutlined /></Button>
        <Button onClick={this.invite}>邀请<UserAddOutlined /></Button>
      </div>
    )
  }

  componentDidMount() {
      this.getUserList();
  }

  getUserList = () => {
    // console.log('getUserList');
    axios.get("/getUserList")
    .then((response) => {
        this.setState({userList: response.data});
    })
    .catch((error) => {
        console.log(error);
    })
  }

  invite = () => {
    if (this.state.selectedUser === "") return;
    PubSub.publish(STARTINVITE, this.state.selectedUser);
  }

}
