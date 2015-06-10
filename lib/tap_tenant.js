/*
 ** Copyright [2013] [Megam Systems]
 **
 ** Licensed under the Apache License, Version 2.0 (the "License");
 ** you may not use this file except in compliance with the License.
 ** You may obtain a copy of the License at
 **
 ** http://www.apache.org/licenses/LICENSE-2.0
 **
 ** Unless required by applicable law or agreed to in writing, software
 ** distributed under the License is distributed on an "AS IS" BASIS,
 ** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ** See the License for the specific language governing permissions and
 ** limitations under the License.
 */

var http = require('http');
var url = require('url');
var tenantNumber = 1;
var nickNames = {};
var currentRoom = {};
var path, roomname;
var namesUsed = [];
var socketio = require('socket.io');

var tapdb = require('./tap_source.js');
var tap = require("../tap.js");

/**
 * Export the socket io's listen function.
 */
exports.listen = function(server) {
	io = socketio.listen(server);
	// io.set('log level', 2); // configure it later.
	console.log("==> listen called <==");	
	
	 io.sockets.on('connection', function(socket) {
		/**
		 * create a random tenant name attached to a node. for instance each
		 * tenant <localhost>/stream/node1 will be assigned a name tenant_001.
		 * They will be joined to "node1". It is assumed that multiple tenants
		 * can watch node 1.
		 */	
		
		//var logname = tap.logname; 
		 /*
			 * import the request id from tap.js and this logname is equal redis
			 * key
			 */		
			//	var logname;

		socket.on('message', function(data){	                       
		console.log("==> socket connection <==");		
		var logname = data;		                               
		tenantNumber = assignTenantName(socket, tenantNumber, nickNames,namesUsed);	
		handleMessageBroadcasting(logname, socket, currentRoom);
        joinTenantToNode(socket, logname);        
		}) ; 
		//handleMessageBroadcasting(logname, socket, currentRoom);	
		handleClientDisconnection(socket, nickNames);
	});
};

function assignTenantName(socket, tenantNumber, nickNames, namesUsed) {
	var name = 'Tenant' + tenantNumber;                                     
	nickNames[socket.id] = name;	
	namesUsed.push(name);                                                   // Megam test: check currect room
	return tenantNumber + 1;
}

function joinTenantToNode(socket, room) {	
	socket.join(room);
	currentRoom[socket.id] = room;
//	console.log("joining");
//	console.log(room);	
	return currentRoom[socket.id];
}

function handleMessageBroadcasting(logname, socket, currentRoom) {
    //    console.log("message broadcast : " + currentRoom[socket.id]);
	//    console.log("Socket Handle ==> " +socket.id);
    //    console.log("Current Room Handle ==> " +currentRoom[socket.id]);
        console.log("Log name Handle ==> " +logname);
	var message = tapdb.ss(logname, socket, currentRoom);
}

function handleClientDisconnection(socket, nickNames) {
	socket.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);		
		delete nickNames[socket.id];
	});
}


