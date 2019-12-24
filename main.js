"use strict";

const http = require('http');
const fs = require('fs');
const os = require('os');
const exec = require('child_process').exec;

var ringingInProgress = false;
var timerId = undefined;

process.env.PATH = process.env.PATH + ';C:\\Program Files (x86)\\VLC';

function log(message) {
	console.log('# ' + message);
}

if (!fs.existsSync('C:\\Program Files (x86)\\VLC\\vlc.exe')) {
	log('vlc.exe not found');
	process.exit(1);
}

function ring() {
	if (ringingInProgress) {
		log('already ringing');
		return;
	}

	log('ringing...');
	ringingInProgress = true;

	exec('vlc.exe --qt-start-minimized --play-and-exit --stop-time 9.5 "Vánoční zvoneček.mp3"', function(err, stdout, stderr) {
		if (err) {
			log('ringing error: ' + err);
		}

		log('ringing done');
		ringingInProgress = false;
	});
}

function requestListener(req, res) {
	log(req.method + ' ' + req.url);

	if (req.url === '/favicon.ico') {
		res.statusCode = 404;
		res.end();
	}
	else if (req.url === '/ring' || req.url === '/ring-delayed') {
		res.setHeader('Content-type', 'text/html');
		res.end(
			'<html>'
				+ '<head>'
					+ '<script> window.location.replace("/"); </script>'
				+ '</head>'
			+ '</html>'
		);

		if (req.url === '/ring') {
			log('command: ring');
			ring();
		}
		else if (req.url === '/ring-delayed'){
			log('command: delayed ring');
			clearTimeout(timerId);
			timerId = setTimeout(function() {
				ring();
				timerId = undefined;
			}, 3 * 60 * 1000);
		}
	}
	else {
		res.setHeader('Content-type', 'text/html');
		res.end(
			'<html>'
				+ '<head>'
					+ '<meta name="viewport" content="width=150, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />'
					+ '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'
					+ '<title>Ježíšek</title>'
					+ '<style> body { text-align: center; } a:link, a:visited { color: darkgreen; } </style>'
				+ '</head>'
				+ '<body>'
					+ '<h1>Ježíšek</h1>'
					+ '<h3><a href="/ring">Zazvonit teď</a></h3>'
					+ '<h3><a href="/ring-delayed">Zazvonit za 3 minuty</a></h3>'
				+ '</body>'
			+ '</html>'
		);
	}
};

const port = 8080;
const server = http.createServer(requestListener);

server.listen(port, function() {
	log('HTTP server listening on: http://' + os.hostname() + ':' + port);
});

log('HTTP server starting...');
