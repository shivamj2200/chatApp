const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const port = process.env.PORT || 5000
const colors = require("colors")
const  {notFound,errorHandler} = require("../backend/middleware/errorMiddleware")
const userRoutes = require("./routes/userRoutes")
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const { Socket } = require("dgram");
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(cors())
app.use('/api/user',userRoutes)
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use(notFound)
app.use(errorHandler)
app.get("/",(req,res)=>{
    res.send("Api is running")
})
const server = app.listen(port,()=>{
    console.log(`server running ${port}`.yellow.bold)
})

const io = require("socket.io")(server,{
    pingTimeout:60000,
    cors:{
        origin:"http://localhost:3000"
    }
});

io.on("connection",(socket)=>{
console.log("connected to socket.io")
socket.on("setup",(userData)=>{
    socket.join(userData._id)
    socket.emit("connected");
});

socket.on("join chat",(room)=>{
    socket.join(room)
    console.log("User Joined Room :" +room)
});


socket.on("typing",(room)=>socket.in(room).emit("typing"));
socket.on("stop typing" , (room)=>socket.in(room).emit("stop typing"));

socket.on("new message",(newMessageRecived)=>{
    var chat =  newMessageRecived.chat;

    if(!chat.users)
    return console.log("chat.users not defined");

    chat.users.forEach((user)=>{
        if(user._id==newMessageRecived.sender._id)return;

        socket.in(user._id).emit("message recieved", newMessageRecived);
    })
})
socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
})