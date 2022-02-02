const path=require('path');
const express=require('express');
const http=require('http');
const badWords=require('bad-words')
const socketio=require('socket.io');
const {generateMessage,generateLocation}=require('./utils/messages')
const {addUser,removeUser,getUserInRoom,getUser}=require('./utils/users')
const app=express();
const server=http.createServer(app);

const io=socketio(server);
const port=process.env.PORT||3000;
const publicPath=path.join(__dirname,'../public');

app.use(express.static(publicPath));


io.on('connection',(socket)=>{
    console.log('New Connection Received!');
    socket.on('join',({username,room},callback)=>{
        socket.join(room);
        const {user,error}=addUser({id:socket.id,username,room})
        if(error)
            return callback(error)
        socket.emit('printMessage',generateMessage("Admin",'Welcome!'))
        socket.broadcast.to(user.room).emit('printMessage',generateMessage('Admin',user.username+' Has Joined!'))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users:getUserInRoom(user.room)
        })
        callback();
    })
    
    socket.on('sendMessage',(message,callback)=>{
        const filter=new badWords();
        if(filter.isProfane(message)){
            return callback('The message Contains bad words!');
        }
        const user=getUser(socket.id);
        if(!user){
            return callback('Cannot parse')
        }
        io.to(user.room).emit('printMessage',generateMessage(user.username,message));
        callback();
    })
    socket.on('sendLocation',(location,callback)=>{
        const user=getUser(socket.id);
        if(!user)
        {
            return callback('User does not exist!')
        }
        io.to(user.room).emit('printLocationMessage',generateLocation(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback();
    })
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id);
        if(user){
            io.emit('printMessage',generateMessage('Admin',user.username+' User Left!'));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users:getUserInRoom(user.room)
            })
        }
    })
})

server.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})