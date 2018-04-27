/**
 * Node Server
 * @author Jan-Patrick Kirchner [742143], Felix Hennig [752734], Konstantinos Karagkiozis [752753]
 * @version 1.0
 */
 
 
var express = require('express');
var app = require('express')();
var path = require('path');
var http = require('http').Server(app);
var server = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
	
var numUsers = 0;		// number of users
var users = {};			// contains sockets
var userNames = [];		// names of users

/*

*/
io.on('connection', function(socket){
	
	console.log('a user connected');
	
	/*
	Login process
	*/
	socket.on('add_User', function(username) {
		
		var username = username.replace(/[ `~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
		
		if(users[username]) {
			console.log('user exist: '+ username);
			socket.emit('login_failed', { });			// username is taken
		}
		else {
			console.log('add user: '+ username);
			socket.username = username;
			
			userNames.push(username);
			
			users[username] = socket.id;

			numUsers++;
			
			socket.emit('login', {						// call client login
				username: username
			});
			
			io.emit('userList', {						// sends userList to all clients
				userList: userNames
			});
			
			socket.broadcast.emit('user_joined', {		// sends user joined message to other clients
				username: socket.username
			});
		}
	});
	
	/*
	removes user
	called when a user disconnects
	*/
	socket.on('disconnect', function(){
		console.log('user disconnected: ' + socket.username);
		
		numUsers--;
		delete users[socket.username];

		remove(userNames, socket.username);
		
		socket.broadcast.emit('userList', {				// sends userList to all other clients
			userList: userNames
		});
		
		socket.broadcast.emit('user_disconnected', {	// sends user disconnected message to other clients
			username: socket.username	
		});
	
	});

	/*
	remove element from array
	*/	
	function remove(array, element) {
		const index = array.indexOf(element);

		if (index !== -1) {
			array.splice(index, 1);
		}
	}
	
	/*
	creates a timeStamp
	*/	
	function timeStamp() {
		var date = new Date();
		
		var year = date.getFullYear();
		var month = date.getMonth()+1;
		var day = date.getDate();
		var hours = date.getHours();
		var minutes = date.getMinutes()
		
		if(minutes < 10){
			var minutes = "0" + minutes;
		}
		if(hours < 10){
			var hours = "0" + hours;
		}
		if(month < 10){
			var month = "0" + month;
		}
		if(day < 10){
			var day = "0" + day;
		}
		
		var time = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
			
		return time;
	}
	
  	/*
	receives message from a user
	sends message to one or all clients
	*/	
	socket.on('chat_message', function(data){
		console.log('user: ' + socket.username + ' send message');
		console.log('message: ' + data.msg);
		
		var time = timeStamp();
		

		if(data.dest != null) {					
			socket.broadcast.to(users[data.dest]).emit('chat_message', {	// sends to specific client
				user: socket.username,
				date: time,
				message: data.msg,
				dest: data.dest
			});
			
			socket.emit('chat_message', {		// send message to self client
				user: socket.username,
				date: time,
				message: data.msg,
				dest: data.dest
			});
		}
		else {			
			io.emit('chat_message', {			// sends to all clients
				user: socket.username,
				date: time,
				message: data.msg
			});
		}

	});
  
  	/*
	receives file+message from a user
	sends file+message to one or all clients
	*/	
	socket.on('file', function(file, type, data){
        console.log(socket.username + ' is sharing a file');
		
		var time = timeStamp();
		
		if(data.dest != null) {		
			socket.broadcast.to(users[data.dest]).emit('file', file, type, {	// sends to specific client
				user: socket.username,
				date: time,
				message: data.message,
				dest: data.dest
			});
		}
		else{
			socket.broadcast.emit('file', file, type, {				// sends to all clients but not self
				user: socket.username,
				date: time,
				message: data.message
			});
		}

	});

});

/*
listen on Port XXXX
*/	
http.listen(port, function(){
	console.log('listening on *:' + port);
});
