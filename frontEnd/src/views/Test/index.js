import React, { Component } from 'react'
import {IPCMESSAGETEST} from "../../channel.js"
import {Input, Button} from "antd"

// import PubSub from 'pubsub-js'
// PubSub.publish(name, params)
// PubSub.subscribe(name, func)
// PubSub.unsubscribe(name)

class Test extends Component {
    constructor(props) {
        super(props);
        this.refFileHolder = React.createRef();
        
    }

    state = {
        response: "",
        files: [],
        val: ""
    } 

    render() { 
        return (
            <div>
                <div>组件测试</div>
                <button onClick={this.sendIpcMessage}>Send</button>
                <div>{this.state.response}</div>
                <div ref={this.refFileHolder} style={{height: "200px", border: "1px solid", fontSize: ".5rem"}}>
                    Drop your file here:
                    {this.state.files.map((val) => <p key={val.name}>{val.name} {val.path}</p>)}
                </div>
                <div>
                    <Input value={this.state.val} onChange={e => this.setState({val: e.target.value})}></Input>
                    <Button onClick={this.sendWebSocketMessage}>提交</Button>
                </div>
            </div>
        );
    }

    componentDidMount() {
        // console.log("componentDidMount");
        this.refFileHolder.current.ondragover = this.refFileHolder.current.ondragleave = this.refFileHolder.current.ondragend = () => {
            return false;
        }

        this.refFileHolder.current.ondrop = (e) => {
            e.preventDefault();
            console.log(Array.from(e.dataTransfer.files))
            this.setState({files: Array.from(e.dataTransfer.files)})
            
        }

    }

    componentWillUnmount() {
        window.ipcRenderer.removeAllListeners("ss");
    }

    sendIpcMessage = () => {
        window.ipcRenderer.on("ss", (event, arg) => {
            this.setState({response: arg.filePaths});
            console.log("ss")
        })
        window.ipcRenderer.send(IPCMESSAGETEST, "Open files");
        console.log("sendIpcMessage")
    }

    sendWebSocketMessage = () => {
        console.log(this.state.val);
        this.ws = new WebSocket("ws://localhost:5051");
        this.ws.onopen = (e) => {
            console.log("open")
            console.log(e);
            this.ws.send(JSON.stringify({type: "Login", username: "user"}))
        };
        this.ws.onmessage = (e) => {
            console.log("message")
            // console.log(e);
            window.e = e;
        }
        this.ws.onclose = (e) => {
            
            console.log("close")
            console.log(e);
        }
        setTimeout(() => {
            this.ws.send(JSON.stringify({type: "Logout", username: "user"}))
            this.ws.close();
        }, 5000)
    }

}
 
export default Test;