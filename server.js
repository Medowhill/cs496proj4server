var net = require('net');

const PLAYER_NUM = 1;

var gamerNum = 0;
var gamers = [];
var start = [];
var playGame = false, before1 = false;

for (var i = 0; i < PLAYER_NUM; i++)
	gamers.push(null);

function remove(socket) {
	if (socket.name == 'p') 
        console.log('Pad left');
    else {
    	var index = socket.name.charAt(0) - '0';
    	if (gamers[index] != null) {
    		gamers[index] = null;
    		gamerNum--;
        	console.log('Gamer' + index + ' left');
    	}

        if (gamerNum == 0 && playGame) {
    		playGame = false;
    		console.log('Game finish');
        }
    }
}

net.createServer(function(socket) {
    socket.name = '';

    socket.on('data', function(data) {
    	if (socket.name == '') {
    		if (data[0] == 0) {
    			socket.name = 'p';
    			console.log('Pad connected');
    		}
    		else {
    			if (PLAYER_NUM == gamerNum) {
    				socket.end();
    				return;
    			}

    			socket.setNoDelay(true);
    			var i;
    			for (i = 0; i < gamers.length; i++) {
    				if (gamers[i] == null) {
    					socket.name = '' + i;
			   			socket.write(new Buffer([i]));
    					gamers[i] = socket;
    					gamerNum++;
    					console.log('Gamer' + i + ' connected');
    					break;
    				}
    			}

			    if (!playGame && gamerNum == PLAYER_NUM) {
			    	start = [];
			    	for (var i = 0; i < PLAYER_NUM; i++)
			    		start.push(0);
			    	playGame = true;

			    	gamers.forEach((gamer) => {
						if (gamer != null)
			    			gamer.write(new Buffer([255]));
			    	});
			    	setTimeout(() => {
			    		gamers.forEach((gamer) => {
			    			if (gamer != null)
			    				gamer.write(new Buffer([254]));
			    		});

			    		setTimeout(() => {
				    		before1 = true;
							gamers.forEach((gamer) => {
				    			if (gamer != null)
				    				gamer.write(new Buffer([253]));
				    		});

				    		setTimeout(() => {
					    		var arr = start.map((data, i) => ((0 <= data && data <= 40) ? data : 0));
					    		before1 = false;
								gamers.forEach((gamer) => {
					    			if (gamer != null) {
					    				gamer.write(new Buffer([252]));
					    				gamer.write(new Buffer(arr));
					    			}
					    		});
				    			console.log('Game start');

				    			setTimeout(() => {
						    		gamers.forEach((gamer) => {
						    			if (gamer != null)
						    				gamer.write(new Buffer([251]));
						    		});
						    	}, 1000);
							}, 1000);
						}, 1000);
			    	}, 1000);
			    }
    		}
    	} else if (socket.name == 'p') {
    		if (playGame) {
    			if ((data[2] & 1) == 1) {
    				if (before1)
    					start[data[0]] += 1;
    				else
    					start[data[0]] = -100;
    			}

	            gamers.forEach(function(gamer) {
    				if (gamer != null)
	                	gamer.write(data);
	            });
	        }
    	} else {
    		if (playGame) {
    			gamers.forEach(function(gamer) {
    				if (gamer != null) {
    					gamer.write(data);
    					if (data[0] == 250)
		    				gamer.end();
		    		}
    			});
	    		if (data[0] == 250) {
    				playGame = false;
		    		console.log('Game finish');
	    		}
			}
    	}
    });

    socket.on('end', function() {
        remove(socket);
    });

    socket.on('error', function(err) {
    	console.log(err.message);
        remove(socket);
    });
}).listen(3000);
console.log("server running at port 3000");