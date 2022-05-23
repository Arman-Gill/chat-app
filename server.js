const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const mongoDB = 'mongodb+srv://arman-gill:Tcs2Wipro@cluster0.cd628.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(mongoDB).then(()=>{
    console.log('connected');
}
)
const Msg = require('./models/messages');

const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
});

app.get('/', (req, res) => {
    res.send('Server is running');
})

let userList = new Map();

io.on('connection', (socket) => {
    let userName = socket.handshake.query.userName;
    addUser(userName, socket.id);

    socket.broadcast.emit('user-list', [...userList.keys()]);
    socket.emit('user-list', [...userList.keys()]);

    socket.on('message', (msg) => {
        const message = new Msg({msg});
        message.save().then(()=>{
            socket.broadcast.emit('message-broadcast', {message: msg, userName: userName});
        }
        )
        
    })

    socket.on('disconnect', (reason) => {
        removeUser(userName, socket.id);
    })
});

function addUser(userName, id) {
    if (!userList.has(userName)) {
        userList.set(userName, new Set(id));
    } else {
        userList.get(userName).add(id);
    }
}

function removeUser(userName, id) {
    if (userList.has(userName)) {
        let userIds = userList.get(userName);
        if (userIds.size == 0) {
            userList.delete(userName);
        }
    }
}

http.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running ${process.env.PORT || 3000}`);
});