const mongoose = require("mongoose");
const express = require('express');
let ejs = require('ejs');
const downsample = require("downsample");
const SMA = downsample.SMA;
const ASAP = downsample.ASAP;

// const MultiElo = require('multi-elo').MultiElo;
const MultiElo = require('./elo/index.js').MultiElo;
const MultiEloMario = new MultiElo({
	s: 1.1,
	d: 200,
	k: 64,
	verbose: false
});
// const MultiEloMarioInternal = new MultiElo({
// 	s: 1.5,
// 	d: 200,
// 	k: 64,
// 	verbose: false
// });

require('dotenv').config();

const PlayerSchema = new mongoose.Schema({
	name: {type: String, unique : true, required : true, dropDups: true},
	elo: [Number]
});
const Player = mongoose.model('Player', PlayerSchema);

const RaceSchema = new mongoose.Schema({
	track: String,
	date: Date,
	result: Array
});
const Race = mongoose.model('Race', RaceSchema);


const Track = mongoose.model('Track', PlayerSchema);

const INITIAL_PLAYERS = [
	{name: "Brennan", elo: 1200},
	{name: "Brandon", elo: 1250},
	{name: "Cassidy", elo: 1350},
	{name: "Darren", elo: 1250},
	{name: "Dillan", elo: 1400},
	{name: "Marly", elo: 1200},
	{name: "Santi", elo: 1200},
	{name: "Sean", elo: 1250},
];

const getElo = (player, all) => new Promise((resolve, reject) => {
	Player.findOne({name: player}, (err, doc) => {
		if(err){
			reject(err);
		}
		else{
			if(all){
				resolve(doc.elo);
			}
			else{
				resolve(doc.elo[doc.elo.length - 1]);
			}
		}
	});
});

const addElo = (player, elo, trackElo) => new Promise((resolve, reject) => {
	getElo(player, true).then(elos => {
		const ratio = trackElo / 100;
		elo = elos[elos.length - 1] + ((elo - elos[elos.length - 1]) * ratio);
		Player.updateOne({name: player}, {elo: [...elos, elo]}, (err, doc) => {
			if(err){
				reject(err);
			}
			else{
				resolve();
			}
		});
	}).catch(reject);
});

function absSqrt(val){
	return (val > 0 ? 1 : -1) * Math.sqrt(Math.abs(val));
}

const getAveragePosition = (races, player) => races.map(r => r.result).flat().filter(r => r.name === player).map(r => r.position).reduce((a, b) => a + b, 0) / races.filter(r => r.result.some(p => p.name === player)).length;

const race = async (players, trackName) => {
	const scoreboard = new Array(12);
	players.forEach((player, i) => {
		// if(scoreboard[player.position]){
			// console.error("===================")
			// console.error("Duplicate position!!!")
			// console.error(trackName, players)
			// console.error("Please fix!!!")
			// console.error("===================")
		// }
		while(scoreboard[player.position]){
			player.position += 1;
			console.log("Bumping player",player.name,"to position",player.position + 1)
		}
		scoreboard[player.position] = {name: player.name, elo: player.elo};
	});
	let comElo = 700 + (4 - players.length) * 100;
	for (let i=11; i >= 0; i--){
		if(!scoreboard[i]){
			scoreboard[i] = {name: "COM", elo: comElo}
			comElo += 100;
		}
	}

	const raceHistory = await new Promise((resolve, reject) => {
		Race.find({}, (err, doc) => {
			if(err) reject(err);
			resolve(doc);
		});
	});

	const track = await new Promise((resolve, reject) => {
		Track.findOne({name: trackName}, (err, doc) => {
			if(err) reject(err);
			resolve(doc);
		})
	});

	const initialShiftedElo = MultiEloMario.getNewRatings(scoreboard.map(p => p.elo));
	// const playerShiftedElo = MultiEloMarioInternal.getNewRatings(players.map(p => p.elo)).map((e, i) => e - players[i].elo);
	// const playerExpectedScores = MultiEloMarioLinear.getExpectedScores(players.map(p => p.elo));
	// let playerExpectedScores = MultiEloMarioLinear.getExpectedScores(players.map(p => p.elo));
	// playerExpectedMultiplers = playerExpectedScores.map(v => 1 / Math.abs(1/playerExpectedScores.length - v)/100)
	// console.log(playerExpectedScores, playerExpectedMultiplers)


	let totalShift = 0;
	let netShift = 0;
	let pos = [false, false, false, false];
	let totalComps = 0;
	for(i in scoreboard){
		if(scoreboard[i].name !== "COM"){
			netShift += (parseInt(i) - getAveragePosition(raceHistory, scoreboard[i].name))
			totalShift += Math.abs(parseInt(i) - getAveragePosition(raceHistory, scoreboard[i].name))
			if(parseInt(i) < 4){
				pos[parseInt(i)] = true;
			}
			totalComps += 1;
		}
	}
	if(players.length === 0){
		totalComps = 1;
	}
	const offset = (2 - Math.abs(totalShift / totalComps)) + absSqrt((-1 - (netShift / totalComps))) / 4;
	let adjusted = absSqrt(offset * 30);

	if(pos.reduce((acc, nxt, i) => acc && (nxt || (i+1 > totalComps)), true)){
		adjusted += 6;
	}

	if(players.length === 0){
		adjusted = 0;
	}

	await new Promise((resolve, reject) => {
		Track.updateOne({name: track.name}, {elo: [...(track.elo), track.elo[track.elo.length - 1] + adjusted]}, (err, doc) => {
			if(err){
				reject(err);
			}
			else{
				resolve();
			}
		});
	});


	let playerIndex = 0;
	for(i in scoreboard){
		if(scoreboard[i].name !== "COM"){
			// await addElo(scoreboard[i].name, initialShiftedElo[i] + playerShiftedElo[playerIndex], track.elo[track.elo.length - 1] + adjusted);
			// await addElo(scoreboard[i].name, players[playerIndex].elo + (initialShiftedElo[i] - players[playerIndex].elo) * playerExpectedScores[playerIndex], track.elo[track.elo.length - 1] + adjusted);
			await addElo(scoreboard[i].name, initialShiftedElo[i], track.elo[track.elo.length - 1] + adjusted);
			playerIndex += 1;
		}
	}
	return initialShiftedElo;
}



mongoose.connect(process.env.CONNECTION_STRING).then(() => {
	console.log("Connected to database");
	const app = express()
	app.set('view engine', 'ejs');
	app.use(express.urlencoded({ extended: true }))

	app.get('/', (req, res) => {
		res.sendFile('index.html', {root: "."}, (err) => {
			res.end();
			if (err) throw(err);
		});
	});

	app.get("/player/:player", (req, res) => {
		const track = req.query.track ?? "All";
		Player.find({name: req.params.player}, (err, players) => {
			Race.find({result: {
				$elemMatch: { name: req.params.player }
			}}, (err2, races) => {
				res.render("pages/player", {
					player: players[0],
					races: races,
					track
				});
			});
		});
	});


	app.get("/track/:track", (req, res) => {
		Track.find({name: req.params.track}, (err, track) => {
			Race.find({track: req.params.track}, (err2, races) => {
				res.render("pages/track", {
					races,
					track: track[0]
				});
			});
		});
	});


	app.get('/rankings', (req, res) => {
		Player.find({}, (err, players) => {
			Race.find({}, (err2, races) => {
				Track.find({}, (err3, tracks) => {
					res.render('pages/rankings', {
						players: players.map(p => ({
							name: p.name,
							elo: Math.round(p.elo[p.elo.length - 1]),
							races: Math.round((p.elo.length - 1) / races.length * 100),
						})).sort((a, b) => b.elo - a.elo),
						races,
						tracks
					});
				});
			});
		});
	});

	app.get("/graphData", (req, res) => {
		const smooth = parseInt(req.query.smooth ?? "0");
		Player.find({}, (err, playersData) => {
			Race.find({}, (err2, races) => {
				const data = {};
				const players = {};
				playersData.forEach((player, i) => {
					data[player.name] = [{x: 0, y: 1500}];
					players[player.name] = player;
					playersData[i].elo = playersData[i].elo.slice(1);
				});
				races.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach((race, index) => {
					race.result.forEach((result, j) => {
						data[result.name] = [
							...(data[result.name]),
							{x: index + 1, y: players[result.name].elo[0]}
						];
						players[result.name].elo = players[result.name].elo.slice(1);
					});
				});

				if(smooth && smooth > 0){
					Object.keys(data).forEach((playerName, i) => {
						data[playerName] = SMA(data[playerName], smooth);
					});

				}

				res.json({
					data,
					races: ["",...(races.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(r => r.track))]
				});
			});
		});

	});

	app.get('/graphs', (req, res) => {
		res.render("pages/charts");
	});

	app.get("/replay", (req, res) => {
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		if(ip === "::1"){
			Race.find({}, async (err, races) => {
				for(r in races){
					// if(r > 10){break;}
					const players = races[r].result;
					for(i in players){
						const elo = await getElo(players[i].name);
						players[i].elo = elo;
					}
					const shift = await race(players, races[r].track);
					console.log(`${Math.round(r/races.length*100)}%`)
					// console.log(players.sort((a,b) => a.position - b.position).map(p => [p.position + 1, -1 * (p.elo - shift[p.position])]))
				}
				// Track.find({}, (e, ts) => {
				// 	ts.forEach((t, i) => {
				// 		console.log(t.name, t.elo);
				// 		console.log("Done.")
				// 	});
				// 	res.send("Done.");
				// })
				console.log("Done.")
				res.send("Done.");
			})
		}
		else{
			res.status(401).send("Sike Bitch");
		}
	});

	app.get("/resetRaces", (req, res) => {
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		if(ip === "::1"){
			Race.deleteMany({}, () => {
				res.send("Done.")
			})
		}
		else{
			res.status(401).send("Sike Bitch");
		}
	});

	app.get("/add", (req, res) => {
		[
			"New York Minute",
			"Mario Circuit 3 (SNES)",
			"Kalimari Desert",
			"Waluigi Pinball",
			"Sydney Sprint",
			"Snow Land",
			"Mushroom Gorge",
			"Sky-High Sundae",
		].forEach((t, i) => {
			new Track({
				name: t,
				elo: [75]
			}).save();
		});
		res.send("success")
	})


		const tracks = [
			"Baby Park",
			"Cheese Land",
			"Excitebike Arena",
			"Yoshi Valley",
			"New York Minute",
			"Mario Circuit 3 (SNES)",
			"Kalimari Desert",
			"Waluigi Pinball",
			"Sydney Sprint",
			"Snow Land",
			"Mushroom Gorge",
			"Sky-High Sundae",
			"Animal Crossing",
			"Big Blue",
			"Bone-Dry Dunes",
			"Bowser's Castle (Wii U)",
			"Cheep Cheep Beach",
			"Choco Mountain",
			"Cloudtop Cruise",
			"Coconut Mall",
			"DK Jungle",
			"Dolphin Shoals",
			"Donut Plains 3",
			"Dragon Driftway",
			"Dry Dry Desert",
			"Electrodrome",
			"Grumble Volcano",
			"Hyrule Circuit",
			"Ice Ice Outpost",
			"Koopa Cape",
			"Mario Circuit",
			"Mario Circuit (GBA)",
			"Mario Circuit (Wii U)",
			"Mario Kart Stadium",
			"Moo Moo Meadows",
			"Mount Wario",
			"Music Park",
			"Mute City",
			"Neo Bowser City",
			"Ninja Hideaway",
			"Paris Promenade",
			"Piranha Plant Slide",
			"Rainbow Road (N64)",
			"Rainbow Road (SNES)",
			"Rainbow Road (Wii U)",
			"Ribbon Road",
			"Royal Raceway",
			"Sherbet Land (GCN)",
			"Shroom Ridge",
			"Shy Guy Falls",
			"Sky Garden",
			"Sunshine Airport",
			"Super Bell Subway",
			"Sweet Sweet Canyon",
			"Thwomp Ruins",
			"Tick-Tock Clock",
			"Toad Circuit",
			"Toad Harbor",
			"Toad's Turnpike",
			"Tokyo Blur 1",
			"Twisted Mansion",
			"Wario Stadium (DS)",
			"Wario's Gold Mine",
			"Water Park",
			"Wild Woods",
			"Yoshi Circuit"
		];

	app.get("/reset", (req, res) => {
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		if(ip === "::1"){
			Player.deleteMany({}, () => {
				INITIAL_PLAYERS.forEach((player, i) => {
					new Player({
						name: player.name,
						elo: [1500]//[player.elo]
					}).save();
				});
				Track.deleteMany({}, () => {
					tracks.forEach((t, i) => {
						new Track({
							name: t,
							elo: [100],

						}).save();
					});
					res.send("Done.")
				});
			});
		}
		else{
			res.status(401).send("Sike Bitch");
		}
	});

	app.get('/race', async (req, res) => {
		const players = Object.keys(req.query).filter(k => k !== "track").map(player => ({
			name: player,
			position: req.query[player].length > 0 ? parseInt(req.query[player]) - 1 : -1
		})).filter(p => p.position > -1);

		for(i in players){
			const elo = await getElo(players[i].name);
			players[i].elo = elo;
		}

		const track = req.query.track;

		new Race({
			track,
			date: new Date(),
			result: players
		}).save();

		await race(players, track);

		res.redirect("/");
	});

	app.listen(process.env.PORT ?? 8080, () => {
		console.log(`Mariokart app listening on port ${process.env.PORT ?? 8080}`)
	});

}).catch(console.error);
