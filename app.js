const express = require('express');
const app = express();
const serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.send('')
});

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

const USER_LIST = {}

const RED_TEAM = {length:0}
const BLUE_TEAM = {length:0}

let frame = {
	bluePong: 500,
	redPong: 500,
}

let nextComputedMovement = {
	blue:0,
	red:0,
}

const calculateNextFrame = () => {
	frame.bluePong += nextComputedMovement.blue
	frame.redPong += nextComputedMovement.red

	// console.log('frame',frame);

	return frame
}

const assignTeam = (player) => {
	let assignedTeam;
	if (RED_TEAM.length <= BLUE_TEAM.length) {
		RED_TEAM[player] = {id: player};
		RED_TEAM.length++
		assignedTeam = 'red';
	} else {
		BLUE_TEAM[player] = {id: player};
		BLUE_TEAM.length++
		assignedTeam = 'blue';
	}
	return assignedTeam
}

// mockPongMovement = (num) => {
// 	if (num < 1000) num++
// 	if (num === 1000) num = 0
// 	return num
// }

const io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log('someone connected');

	socket.on('playerEnter', (player) => {
		const team = assignTeam(player.id)
		USER_LIST[player.id] = {
			id: player.id,
			team: team
		}

		socket.emit('playerEnterAnswer', USER_LIST[player.id])
	})

	socket.on('pressUp', (data) => {
		// console.log('data:', data);
		// console.log('USERLIST:', USER_LIST);
		nextComputedMovement[data.team]++
	})

	socket.on('pressDown', (data) => {
		// console.log('data:', data);
		// console.log('USERLIST:', USER_LIST);
		nextComputedMovement[data.team]--
	})

	setInterval(() => {
		socket.emit('frame', calculateNextFrame());
		nextComputedMovement.blue = 0;
		nextComputedMovement.red = 0;
	} ,1000)

	socket.on('disconnect',function(){
		console.log('someone disconnected');
	});


});
