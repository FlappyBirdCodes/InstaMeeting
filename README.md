# InstaMeeting
This is a chat application made with socket.io, expressJS and mongoDB. I was originally inspired to create this to imitate a sort of
"meeting" scenario. The starter code for the messaging feature belongs to Brad Traversy. 

In order to start a meeting room, all you have to do is to choose a room name. This room name will be stored in the MongoDB database and
on the server side, a random roomID and room password will be generated. Using the roomID and password, you can access the room. The rooms
are separate and your messages will not show up in another room. You can also leave the room and the server will process this change.

# Skills
This project highlights my ability to integrate different systems together. I had to carefully integreate the messaging feature into my web application as doing so irresponsibly can cause many unwanted side effects and bugs. Additionally, the adding of the "rooms" concepts and keeping the messages separate from each room was also an important aspect of this project. In order to create new rooms and store room information such as roomIDs and passwords, I had to interact with a mongoDB database hosted on the cloud with mongoose, a library in javascript. 
