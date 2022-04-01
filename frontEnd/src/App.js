import React, { Component } from 'react';
import {Route, Routes} from "react-router-dom"
import Test from "./views/Test"
import Login from "./views/Login"
import Home from "./views/Home"
import Fight from "./views/Fight"

export default class App extends Component {
  constructor(props) {
    super(props);
    this.ws = new WebSocket("ws://localhost:5051");
    console.log("app constructor")
  }

  render() {
    return (
        <div className="App">
          <Routes>
              <Route exact path="/" element={<Login></Login>}></Route>
              <Route path="/home" element={<Home></Home>}></Route>
              <Route path="/fight" element={<Fight></Fight>}></Route>
              <Route path="/test" element={<Test/>}></Route>
          </Routes>
        </div>
    )
  }

  componentWillUnmount() {
    this.ws.send(JSON.stringify({type: "Logout", username: "user"}))
  }
}


// function App() {
//   return (
//     <div className="App">
//       <Routes>
//           <Route exact path="/" element={<Login></Login>}></Route>
//           <Route path="/home" element={<Home></Home>}></Route>
//           <Route path="/fight" element={<Fight></Fight>}></Route>
//           <Route path="/test" element={<Test/>}></Route>
             
//       </Routes>
//     </div>
//   );
// }

// export default App;
