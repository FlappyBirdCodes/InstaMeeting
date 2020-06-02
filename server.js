const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
const expbs = require("express-handlebars");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const bodyParser = require("body-parser");

//Setting up express handlebars
app.engine("handlebars", expbs());
app.set("view engine", "handlebars");

const MongoDB_URL = "mongodb+srv://flappybird:patrickpatterson333@instameetingrooms-wi2qv.mongodb.net/test?retryWrites=true&w=majority";

//Connecting to mongodb database
mongoose.connect(MongoDB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once("open", () => {
    console.log("MongoDB database connection established successfully");
  });
mongoose.set('useFindAndModify', false);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'InstaGroup Bot';

const Room = require("./Room");

//Creates a roomID and room password
app.use("/create", (req, res, next) => {

  Room.find({}, (err, rooms) => {
    let roomIDs = [];
    for (i = 0; i < rooms.length; i++) {
      roomIDs.push(rooms[i].roomID);
    }
    
    let randomID = Math.floor((Math.random() * 1000000000) + 1);
    let randomPassword = Math.floor((Math.random() * 1000000000) + 1);

    while (roomIDs.includes(randomID)) {
      randomID = Math.floor((Math.random() * 1000000000) + 1);
      console.log(randomID);
    } 

    req.randomID = randomID;
    req.randomPassword = randomPassword;
    next();

  })

})

//Sets room name 
app.use("/chat", (req, res, next) => {
  Room.findOne({roomID: req.query.room}, (err, docs) => {
    if (docs) {
      req.roomName = docs.roomName;
      next();
    }
  })
})

//Renders the index page
app.get("/", (req, res) => {
  res.sendFile('public/index.html' , { root : __dirname});
})

//Renders the join room page
app.get("/joinRoom", (req, res) => {
  res.sendFile('public/joinRoom.html' , { root : __dirname});
})

//Renders the create room page
app.get("/createRoom", (req, res) => {
  res.sendFile('public/createRoom.html' , { root : __dirname});
})

//Sends an error page
app.get("/error", (req, res) => {
  res.render("message", {message: "This room does not exist. Please try again."});
})


//Sends chat room page
app.get("/chatRoom", (req, res) => {
  Room.findOne({roomID: req.query.room}, (err, docs) => {
    if (docs) {
      res.render("chat", {roomName: docs.roomName});
    } else {
        res.redirect("/error");
    }
  })
});

//Redirects to chat room page after log in
app.post("/chatRoom", (req, res) => {
  Room.findOne({roomID: req.body.roomID, roomPassword: req.body.roomPassword}, (err, docs) => {
    if (docs) {

      res.render("chat", {roomName: docs.roomName});

    } else {
        res.redirect("/error");
    }
  })
})

//Renders the room information page once a new room has been created
app.get("/create/:id/:password", (req, res) => {
  res.render("roomInfo", {roomID: req.params.id, roomPassword: req.params.password});
})

//Creates a new room in the mongodb database
app.post("/create", (req, res) => {

  const newRoom = new Room({
    roomName: req.body.roomName,
    roomID: req.randomID,
    roomPassword: req.randomPassword
  })
  newRoom.save();

  res.redirect("/create/" + req.randomID + "/" + req.randomPassword);
})

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to InstaGroup!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
