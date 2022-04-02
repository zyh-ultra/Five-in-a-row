import React, { Component } from 'react'
import { Avatar, Tooltip, Popover, Card } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export default class ChatCard extends Component {
  render() {
    let floating, color, direction, textAlign, title, extra;
    if (this.props.kind) {
        // 对方
        floating = "left";
        color = "cyan";
        direction = "righttop";
        textAlign = "left";
        // title = <Avatar style={{ backgroundColor: color }} icon={<UserOutlined />} size={22} />
    }
    else {
        floating = "right";
        color = "gold";
        direction = "lefttop";
        textAlign = "right";
        // extra = <Avatar style={{ backgroundColor: color }} icon={<UserOutlined />} size={22} />
    }
    // console.log(floating, color, direction, this.props.kind, this.props.content);
    return (
      <div style={{ textAlign: textAlign,  margin: "10px 5px"}}>
          {/* <Avatar style={{ backgroundColor: color, float: floating }} icon={<UserOutlined />} size={22} /> */}
          {/* <div style={{ clear: "both"}}></div> */}
            {/* <Card title={title} extra={extra}> */}
            <Card>
              <Avatar style={{ backgroundColor: color, float: floating, margin: "0px 5px" }} icon={<UserOutlined />} size={22} />{this.props.content}
            </Card>
      </div>
    )
  }
}
