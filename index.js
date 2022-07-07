const mongoose = require("mongoose");
const express = require('express');
let ejs = require('ejs');

// const MultiElo = require('multi-elo').MultiElo;
const MultiElo = require('./elo/index.js').MultiElo;
const MultiEloMario = new MultiElo({
	s: 1.35,
	d: 50,
	k: 32,
	verbose: false
});

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

const INITIAL_PLAYERS = [
	{name: "Brennan", elo: 1200},
	{name: "Brandon", elo: 1250},
	{name: "Darren", elo: 1250},
	{name: "Dillan", elo: 1400},
	{name: "Cassidy", elo: 1350},
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

const addElo = (player, elo) => new Promise((resolve, reject) => {
	getElo(player, true).then(elos => {
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

const race = async (players) => {
	const scoreboard = new Array(12);
	players.forEach((player, i) => {
		scoreboard[player.position] = {name: player.name, elo: player.elo};
	});
	let comElo = 500 + (4 - players.length) * 50;
	for (let i=11; i >= 0; i--){
		if(!scoreboard[i]){
			scoreboard[i] = {name: "COM", elo: comElo}
			comElo += 50;
		}
	}

	const initialShiftedElo = MultiEloMario.getNewRatings(scoreboard.map(p => p.elo));
	for(i in scoreboard){
		if(scoreboard[i].name !== "COM"){
			await addElo(scoreboard[i].name, initialShiftedElo[i]);
		}
	}
	return initialShiftedElo;
}

mongoose.connect(process.env.CONNECTION_STRING).then(() => {
	console.log("Connected to database");
	const app = express()
	app.set('view engine', 'ejs');

	app.get('/', (req, res) => {
		res.sendFile('index.html', {root: "."}, (err) => {
			res.end();
			if (err) throw(err);
		});
	});

	app.get("/player/:player", (req, res) => {
		Player.find({name: req.params.player}, (err, players) => {
			Race.find({result: {
				$elemMatch: { name: req.params.player }
			}}, (err2, races) => {
				res.render("pages/player", {
					player: players[0],
					races: races
				});
			});
		});
	});

	app.get('/rankings', (req, res) => {
		Player.find({}, (err, players) => {
			res.render('pages/rankings', {
				players: players.map(p => ({
					name: p.name,
					elo: Math.round(p.elo[p.elo.length - 1]),
					races: p.elo.length - 1,
				})).sort((a, b) => b.elo - a.elo)
			});
		});
	});

	app.get("/replay", (req, res) => {
		const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		if(ip === "::1"){
			Race.find({}, async (err, races) => {
				for(r in races){
					const players = races[r].result;
					for(i in players){
						const elo = await getElo(players[i].name);
						players[i].elo = elo;
					}
					const shift = await race(players);
					console.log(players.sort((a,b) => a.position - b.position).map(p => [p.position + 1, -1 * (p.elo - shift[p.position])]))
				}
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
				res.send("Done.")
			})
		}
		else{
			res.status(401).send("Sike Bitch");
		}
	})

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

		await race(players);

		res.redirect("/");
	});

	app.listen(process.env.PORT ?? 8080, () => {
		console.log(`Mariokart app listening on port ${process.env.PORT ?? 8080}`)
	});

}).catch(console.error);
