var csv = require('csv');
var fs = require('fs');

const ON = 'ON';
const OFF = 'OFF';

module.exports.fileToFile = function(req, res) {
	var seatOneStatus = OFF;
	
	var fileStream = fs.createReadStream(__dirname + '/../in.csv');

	csv()
	.from.stream(fileStream)
	.to.path(__dirname + '/../out.csv')
	.transform(function(row, index) {	  
		seatOneStatus = processSeat(row[0], seatOneStatus, index)

	  return row;
	})	

	res.send(200); 	
}

module.exports.fileToArray = function(req, res) {
	var fileStream = fs.createReadStream(__dirname + '/../in.csv');
	var dataArr = [];

	csv()
	.from.stream(fileStream)
	.to.array(function(data) {
		console.log(data);
		dataArr = data;
	});	

	res.send(200); 		
}

function processSeat(seatData, previousStatus, index) {
	var currentStatus = seatData == '1' ? ON : OFF;

	if (previousStatus === ON && currentStatus === OFF) {
		console.log(index + ': OFF');
		previousStatus = OFF;
	} else if (previousStatus === OFF && currentStatus === ON) {	
		console.log(index + ': ON');
		previousStatus = ON;
	}

	return previousStatus;
}