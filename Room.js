const mongoose = require("mongoose");

const RoomSchema = mongoose.Schema({
    roomName: String,
    roomID: Number,
    roomPassword: Number
});

module.exports = mongoose.model("Room", RoomSchema);