const express = require('express');
const app = express();
const serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.send('')
});

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

const Game = {
	started:false,
	ready:true,
	height: null,
	width: null,
	timeOfLastAction: null
}

const RED_TEAM = {length:0}
const BLUE_TEAM = {length:0}
const USER_LIST = {}
let NEXT_BATCH = {}

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
	if (frame.bluePong > Game.height) frame.bluePong = Game.height
	if (frame.redPong > Game.height) frame.redPong = Game.height
	if (frame.bluePong < 0) frame.bluePong = 0
	if (frame.redPong < 0) frame.redPong = 0
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

const balanceTeams = () => {
	let player;
	if (RED_TEAM.length > BLUE_TEAM.length +1) {
		player = Object.keys(RED_TEAM)[0]
		playerObject = RED_TEAM[player]
		delete RED_TEAM[player]
		BLUE_TEAM[player] = playerObject
	} else if (BLUE_TEAM.length > RED_TEAM.length +1) {
		player = Object.keys(BLUE_TEAM)[0]
		playerObject = BLUE_TEAM[player]
		delete BLUE_TEAM[player]
		RED_TEAM[player] = playerObject
	}

}

const movingPower = 50;

// mockPongMovement = (num) => {
// 	if (num < 1000) num++
// 	if (num === 1000) num = 0
// 	return num
// }

const io = require('socket.io')(serv,{});

io.sockets.on('connection', function(socket){
	// console.log('someone connected');
	const socketId = socket.id

	socket.on('windowSize', (data) => {
		console.log('--------windowSize:', data)
		Game.height = data.height
		Game.width = data.width
		// console.log('CURRENT GAME STATS:', Game);
	})

	socket.on('playerEnter', (player) => {
		console.log('new Player');
		const team = assignTeam(player.id)
		USER_LIST[player.id] = {
			id: player.id,
			team: team,
			socketId
		}
		currentPlayers = RED_TEAM.length + BLUE_TEAM.length
		Game.timeOfLastAction = Date.now()

		// console.log('Game stats:', Game);
		// console.log('currentPlayers:', currentPlayers);
		// console.log('Blue team:',BLUE_TEAM.length);
		// console.log('Red team:',RED_TEAM.length);

		socket.emit('playerEnterAnswer', USER_LIST[player.id])
		io.sockets.emit('newPlayer', USER_LIST[player.id])
	})

	socket.on('pressUp', (data) => {
		// console.log('data:', data);
		// console.log('USERLIST:', USER_LIST);
		nextComputedMovement[data.team] -= movingPower
		Game.timeOfLastAction = Date.now()
	})

	socket.on('pressDown', (data) => {
		// console.log('data:', data);
		// console.log('USERLIST:', USER_LIST);
		nextComputedMovement[data.team] += movingPower
		Game.timeOfLastAction = Date.now()
	})

	socket.on('endGame', (data) => {
		console.log('game finished---------------------------------------------------------------');
		let winner = data;
		console.log('=== Winner: ',winner);
		console.log('Game stats:', Game);
		io.sockets.emit('announceWinner', winner)
		io.sockets.emit('endGameAnswer', winner)
		Game.started = false;
		// console.log(Game);
		setTimeout(()=> Game.ready = true, 5000)
	})


	// setInterval(()=> {
	// socket.emit('announceWinner', winner)}, 1000)
	setInterval(() => {
		if (Game.started && Date.now() - Game.timeOfLastAction > 10000) {
			console.log('game timed Out---------------------------------------------------------------');
			io.sockets.emit('gameTimedOut')
			Game.started = false;
			Game.timeOfLastAction = Date.now()
			// console.log(Game);
			setTimeout(()=> Game.ready = true, 5000)
		}
		// if (Game.started && Date.now() - Game.timeOfLastAction > 60000) {
		//
		// }

	}, 3000)

	// setInterval(()=> {
	// 	console.log('Current teams length: red:', RED_TEAM.length, 'blue: ', BLUE_TEAM.length);
	// }, 20000)

	setInterval(() => {
		if (Game.started) {
			// console.log('game running');
			socket.emit('frame', calculateNextFrame());
			nextComputedMovement.blue = 0;
			nextComputedMovement.red = 0;
		}

		if (!Game.started && Game.ready && RED_TEAM.length > 0 && BLUE_TEAM.length > 0) {
			console.log('game started---------------------------------------------------------------');
			// balanceTeams()
			Game.timeOfLastAction = Date.now()
			// console.log('Game stats:', Game);
			// console.log('currentPlayers:', currentPlayers);
			console.log('Blue team:',BLUE_TEAM.length);
			console.log('Red team:',RED_TEAM.length);
			setTimeout(()=> io.sockets.emit('startGame', {}), 5000)
			Game.started = true;
			Game.ready = false;
		}
	} ,1000/200)

	socket.on('disconnect', function(socket){
		// console.log('someone disconnected');

		const cleanUserFromList = (socket) => {
			for (let i in USER_LIST) {
				if (!Object.keys(io.sockets.sockets).includes(USER_LIST[i].socketId)) {
					delete USER_LIST[i]

					for (let prop in RED_TEAM) {
						if (prop === i) {
							delete RED_TEAM[prop]
							RED_TEAM.length--
							io.sockets.emit('redPlayerLeft', {})
						}
					}
					for (let prop in BLUE_TEAM) {
						if (prop === i) {
							delete BLUE_TEAM[prop]
							BLUE_TEAM.length--
							io.sockets.emit('bluePlayerLeft', {})
						}
					}
				}
			}
		}
		cleanUserFromList();

		currentPlayers = RED_TEAM.length + BLUE_TEAM.length

		// console.log('Game stats:', Game);
		console.log('currentPlayers:', currentPlayers);
		// console.log('Blue team:',BLUE_TEAM.length);
		// console.log('Red team:',RED_TEAM.length);

		Game.ready = true;

		if (currentPlayers === 0) io.sockets.emit('noPlayers', {})
		if (currentPlayers === 1) io.sockets.emit('onePlayer', {})
		if (currentPlayers > 1) io.sockets.emit('enoughPlayers', {})

	});
});
