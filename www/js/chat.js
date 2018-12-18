ChatEngine = ChatEngineCore.create({
    publishKey: 'pub-c-4574f10f-d8a9-4e54-991b-4b4d5309be43',
    subscribeKey: 'sub-c-5b41fd46-0039-11e9-a39c-e60c31199fb2'
});

// ChatEngine = ChatEngineCore.create({
//     publishKey: 'pub-c-6f35869b-2763-4cd7-b237-128cfe5dc02e',
//     subscribeKey: 'sub-c-1d3aa856-f952-11e8-8ebf-6a684a5fb351'
// });

// use a helper function to generate a new profile
let newPerson = null;
var myChatUser = JSON.parse(localStorage.getItem("currentUser"));
var selectedUser = JSON.parse(localStorage.getItem("selectedUser"));
var chatType = localStorage.getItem('chatType');
// if(chatType == 'group'){
//     var myChatUser = JSON.parse(localStorage.getItem("currentUser"));
// }else{
//     var myChatUser = JSON.parse(localStorage.getItem("selectedUser"));
// }
if(selectedUser){
    $('.chat-with').html(selectedUser.first);
}
if (myChatUser) {
    newPerson = myChatUser;
}else{
    newPerson = generatePerson(true);
}
console.log("newPerson", newPerson);

// create a bucket to store our ChatEngine Chat object
let myChat;

// create a bucket to store 
let me;

// compile handlebars templates and store them for use later
let peopleTemplate = Handlebars.compile($("#person-template").html());
let meTemplate = Handlebars.compile($("#message-template").html());
let userTemplate = Handlebars.compile($("#message-response-template").html());

const source_language = "en";
const target_language = "es";

var allUsers = [];

// this is our main function that starts our chat app
const init = () => {
  
  // connect to ChatEngine with our generated user
  ChatEngine.connect(newPerson.uuid, newPerson);

  // when ChatEngine is booted, it returns your new User as `data.me`
  ChatEngine.on('$.ready', function(data) {

      // store my new user as `me`
      me = data.me;

      // create a new ChatEngine Chat
      var myChatroom = localStorage.getItem('selectedChatRoom');
      console.log("myChatroom", myChatroom);
      myChat = new ChatEngine.Chat(myChatroom);

      // when we recieve messages in this chat, render them
      myChat.on('message', (message) => {
          renderMessage(message);
      });

      // when a user comes online, render them in the online list
      myChat.on('$.online.*', (data) => {   
          console.log("online data::", data);
          allUsers.push(data.user.state);
        $('#people-list ul').append(peopleTemplate(data.user));
        console.log("online allUsers", allUsers);

      });

      // when a user goes offline, remove them from the online list
      myChat.on('$.offline.*', (data) => {
        allUsers.push(data.user.state);

        $('#people-list ul').find('#' + data.user.uuid).remove();
        console.log("offline allUsers", allUsers);

      });

      // wait for our chat to be connected to the internet
      myChat.on('$.connected', () => {
          // search for 50 old `message` events
          myChat.search({
            event: 'message',
            limit: 50
          }).on('message', (data) => {
            
            console.log(data)
            
            // when messages are returned, render them like normal messages
            renderMessage(data, true);
            
          });
        
      });

      // bind our "send" button and return key to send message
      $('#sendMessage').on('submit', sendMessage)

  });

};

// send a message to the Chat
const sendMessage = () => {

    // get the message text from the text input
    let message = $('#message-to-send').val().trim();
  
    // if the message isn't empty
    if (message.length) {
      
        // emit the `message` event to everyone in the Chat
        debugger;
        myChat.emit( 'message', {
            text: message,
            translate: {
                text: message,
                source: source_language,
                target: target_language
            },"pn_gcm": {
                "data" : {
                    "a" : "1"
                }
            }
        } );

        // clear out the text input
        $('#message-to-send').val('');
    }
    
    // stop form submit from bubbling
    return false;
  
};

// render messages in the list
const renderMessage = (message, isHistory = false) => {

    // use the generic user template by default
    let template = userTemplate;

    // if I happened to send the message, use the special template for myself
    if (message.sender.uuid == me.uuid) {
        template = meTemplate;
    }

    let el = template({
        messageOutput: message.data.text,
        time: getCurrentTime(),
        user: message.sender.state
    });
  
    // render the message
    if(isHistory) {
      $('.chat-history ul').prepend(el); 
    } else {
      $('.chat-history ul').append(el); 
    }
  
    // scroll to the bottom of the chat
    scrollToBottom();

};

// scroll to the bottom of the window
const scrollToBottom = () => {
    $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
};

// get the current time in a nice format
const getCurrentTime = () => {
    return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
};

function generatePerson(online, firstName, lastName) {

    var person = {};

    person.first = firstName;
    person.last = lastName;
    person.full = [person.first, person.last].join(" ");
    person.uuid = String(new Date().getTime());

    person.avatar = '';

    person.online = online || false;

    person.lastSeen = Math.floor(Math.random() * 60);


    localStorage.setItem('myChatUser', JSON.stringify(person));
    return person;

}

// boot the app
init();

function loadChatUsers(){
    var request = {
        url: 'application/doctorlist.json',
        type: 'GET',
        contentType: 'application/json',
        headers: {
            Authorization: 'Basic ' + appKeys.onesignal.restAPI
        },
        success: function(response) {
            console.log("response", response);
            successCallback(response);
        },
        fail: function(e) {
            console.log("failure::", e)
            application.hideIndicator();
        }
    };
    $.ajax(request);
}
