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

const movingPower = 50;

// mockPongMovement = (num) => {
// 	if (num < 1000) num++
// 	if (num === 1000) num = 0
// 	return num
// }

const io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log('someone connected');
	const socketId = socket.id

	socket.on('playerEnter', (player) => {
		const team = assignTeam(player.id)
		USER_LIST[player.id] = {
			id: player.id,
			team: team,
			socketId
		}

		socket.emit('playerEnterAnswer', USER_LIST[player.id])
	})

	socket.on('pressUp', (data) => {
		// console.log('data:', data);
		// console.log('USERLIST:', USER_LIST);
		nextComputedMovement[data.team] -= movingPower
	})

	socket.on('pressDown', (data) => {
		// console.log('data:', data);
		// console.log('USERLIST:', USER_LIST);
		nextComputedMovement[data.team] += movingPower
	})

	socket.on('endGame', (data) => {
		console.log('GAME ENDED ------------------------------------------------------------------------------');
	})

	setInterval(()=> {
		console.log('==USER LIST:',USER_LIST)
		console.log('==SOCKET LIST:',Object.keys(io.sockets.sockets));
	}, 2000)

	setInterval(() => {
		socket.emit('frame', calculateNextFrame());
		nextComputedMovement.blue = 0;
		nextComputedMovement.red = 0;
	} ,1000/300)

	socket.on('disconnect',function(socket){
		console.log('someone disconnected');

		const cleanUserFromList = () => {
			for (let i in USER_LIST) {
				if (!Object.keys(io.sockets.sockets).includes(USER_LIST[i].socketId)) {
					delete USER_LIST[i]

					for (let prop in RED_TEAM) {
						if (prop === i) {
							delete RED_TEAM[prop]
							RED_TEAM.length--
						}
					}
					for (let prop in BLUE_TEAM) {
						if (prop === i) {
							delete BLUE_TEAM[prop]
							BLUE_TEAM.length--
						}
					}
				}
			}
		}
		cleanUserFromList();		
	});

});
