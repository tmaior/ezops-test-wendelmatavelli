const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const mongoose = require('mongoose');

server.listen(3000);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const Message = mongoose.model('Message', {
    name: String,
    message: String
});

const dbUrl = 'mongodb+srv://matavellidb:pKnP9gDVkWqz43Oj@clustermatavelli.w4jzs.mongodb.net/chatdb?retryWrites=true&w=majority';

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    });
});

app.post('/messages', (req, res) => {
    const message = new Message(req.body);
    message.save((err) => {
        if (err)
            sendStatus(500);
        io.emit('message', req.body);
        res.sendStatus(200);
    });
});

let connectedUsers = [];


io.on('connection', (socket) => {
    socket.on('join-request', (username) => {
        socket.username = username;
        connectedUsers.push(username);

        socket.emit('user-ok', connectedUsers);
        socket.broadcast.emit('list-update', {
                joined: username,
                list: connectedUsers
            });
    });

    socket.on('disconnect', () => {
        connectedUsers = connectedUsers.filter(u => u != socket.username);
        console.log(connectedUsers);

        socket.broadcast.emit('list-update', {
            left: socket.username,
            list: connectedUsers
        });
    });
});


mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) {
        console.log(err);
    }
});