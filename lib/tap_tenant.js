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
var currentConnections = {};
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
	console.log("==> listen called <==");

	io.sockets.on('connection', function(socket) {
		/**
		 * create a random tenant name attached to a node. for instance each
		 * tenant <localhost>/stream/node1 will be assigned a name tenant_001.
		 * They will be joined to "node1". It is assumed that multiple tenants
		 * can watch node 1.
		 */

		/*
		* import the request id from tap.js and this logname is equal redis
		* key
		*/
		socket.on('message', function(data) {
			console.log("==> socket connection <==");			
			var logname = data;
			tenantNumber = assignTenantName(socket, tenantNumber, nickNames, namesUsed);
			handleMessageBroadcasting(logname, socket, currentRoom);
			joinTenantToNode(socket, logname);
		});		
		socket.on('disconnect', function() {
			console.log("==> socket disconnection <==");
			var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
			var disconn = tapdb.disconn(currentConnections, socket, currentRoom);
			delete nickNames[socket.id];
			delete currentRoom[socket.id];
			delete currentConnections[socket.id];			
		});
	});
};

function assignTenantName(socket, tenantNumber, nickNames, namesUsed) {
	var name = 'Tenant' + tenantNumber;
	nickNames[socket.id] = name;
	namesUsed.push(name);
	// Megam test: check currect room
	return tenantNumber + 1;
}

function joinTenantToNode(socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;
	return currentRoom[socket.id];
}

function joinAMQPToNode(connection, socket) {
	currentConnections[socket.id] = connection;
	return currentConnections[socket.id];
}

function handleMessageBroadcasting(logname, socket, currentRoom) {	
	console.log("Log name Handle ==> " + logname);
	var connection = tapdb.conn();
	joinAMQPToNode(connection, socket);
	var message = tapdb.ss(logname, socket, currentRoom, currentConnections);
}


