var Mutex = require('async-mutex').Mutex;

var fs = require('fs');


var Code = function(db, randomID, attendanceID) {
	this.randomID = randomID;
	this.attendanceID = attendanceID;
	this.running = false;
	this.time_ms = 0;
	this.x = null;
	this.INTERVAL = 10*1000; // ms
	this.NUM_CHAR = 7 // num caracteres
	this.CODE_TYPE = "LN"; //L, N, LN

	this.current_code = '';
	this.code_counter = 0;
	this.db = db;
	this.studentsList = [];
	this.requiresEnrolement = false;
	this.enrolledStudentsList = [];		// enrolled in the course
	this.sequenceCorrectCodes = {};		// {ist1: 1, ist2:3, ...}
	this.studentsCodes = {}				// {ist1:[a], ist2:[a,b,d], ...}
	this.writeSequenteMutex = new Mutex();
	this.codeState = {};
	this.writeCodeMutex = new Mutex();

	this.studentsCofidence = {};
	this.writeConfidente = new Mutex();
	loadStudentsName(db, this, function (Code, data) {
		Code.studentsName = data
	}).then()

};

var CSV_SEPARATOR = ",";
var stream = initStream("test.csv");

Code.prototype.newCode = function() {
	this.startProcess();
	return this.status();
}

Code.prototype.getStudentConfidence = function(ist_id) {
	return this.studentsCofidence[ist_id];
}

Code.prototype.setStudentConfidence = function(ist_id, level) {
	this.studentsCofidence[ist_id] = level;
}

Code.prototype.getSequenceForStudent = function(ist_id) {
	return this.sequenceCorrectCodes[ist_id];
}

Code.prototype.getCodeStatus = function(ist_id) {
	return this.codeState[ist_id];
}

Code.prototype.setCodeStatus = function(ist_id, status) {
	this.codeState[ist_id] = status;
}

Code.prototype.getAttendanceID = function() {
	return this.attendanceID;
}

Code.prototype.getCodeType = function() {
	return this.CODE_TYPE;
}

Code.prototype.getConsecutiveCodes = function() {
	return this.repetitions;
}

Code.prototype.stop = function() {
	this.stopProcess();
	this.running = false;
	return this.status();
}

// letters and numbers
var LN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; 
var N = "0123456789";

Code.prototype.randomCode = function() {
	var text = "";
	var possible = "";
	switch(this.CODE_TYPE){
		case "LN":
			possible = LN;
			break;
		case "L":
			possible = L;
			break;
		case "N":
			possible = N;
			break;
		default:
			break;
	}
	
	for (var i = 0; i < this.NUM_CHAR; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	if(text == "") {
		console.log("Warning: generated invalid random code.");
	}
	return text;
}

Code.prototype.customizeTest = function(num_char, code_type, time, consecutive_codes, requiresEnrolement, studentsEnrolled){
	this.NUM_CHAR = num_char;
	this.CODE_TYPE = code_type;
	this.INTERVAL = time*1000;
	this.repetitions = consecutive_codes;
	this.requiresEnrolement = requiresEnrolement;
	this.enrolledStudentsList = studentsEnrolled || [];
}

Code.prototype.canStudentAccess = function(ist_id) {
	if(!this.requiresEnrolement) {
		return true;
	}
	return this.enrolledStudentsList.includes(ist_id);
}

Code.prototype.status = function() {
	var old_studentsList = this.studentsList.slice();
	let aux_names = []
	for (let i = 0; i < old_studentsList.length; ++i){
		if (this.studentsName[old_studentsList[i]]) aux_names.push(this.studentsName[old_studentsList[i]])
		else aux_names.push(old_studentsList[i])
	}
	this.studentsList.length = 0;
	return {
		current_code: this.current_code,
		code_counter: this.code_counter,
		time_ms: this.time_ms/1000,
		running: this.running,
		//studentsList: old_studentsList,
		studentsList: aux_names,
		total_time_ms: this.INTERVAL
	};
}

Code.prototype.timer_function = function() {
	this.time_ms = this.time_ms - 1*1000;

	if (this.time_ms <= 0) {
		clearInterval(this.x);
		this.x = null;
		this.startCountdown();

	}
}

Code.prototype.startCountdown = function() {
	if(this.x != null) {
		clearInterval(this.x);
	}

	this.time_ms = this.INTERVAL;
	this.nextCode();
	var that = this;
	this.x = setInterval(function(){that.timer_function()}, 1000);
}

Code.prototype.nextCode = function() {
	this.current_code = this.randomCode();
	this.code_counter++;
	this.db.insertCodeServer(this.current_code, this.code_counter, this.attendanceID,
		function(err) {}
	);
}

Code.prototype.stopProcess = function() {
	if(this.x != null) {
		clearInterval(this.x);
	}
	this.running = false;
	return this.status();
}

Code.prototype.startProcess = function() {
	this.running = true;
	this.startCountdown();
}

Code.prototype.clientInput = async function (code_client, ist_id) {
	let result

	if (this.studentsCodes[ist_id] && this.studentsCodes[ist_id].includes(code_client)) {
		result = 'same'
	} else
		result = this.validateCode(code_client, ist_id);

	const release = await this.writeSequenteMutex.acquire();

	try {
		if (ist_id in this.studentsCodes) {
			this.studentsCodes[ist_id].unshift(code_client)
		} else {
			this.studentsCodes[ist_id] = [];
			this.studentsCodes[ist_id].push(code_client);
			this.setCodeStatus(ist_id, '');
		}

		if (result === 'same'){
			this.sequenceCorrectCodes[ist_id] = this.sequenceCorrectCodes[ist_id]
			this.setCodeStatus(ist_id, 'Same')
		}else if (result) {
			if (ist_id in this.sequenceCorrectCodes) {
				this.sequenceCorrectCodes[ist_id] = this.sequenceCorrectCodes[ist_id] + 1;

			} else {
				this.sequenceCorrectCodes[ist_id] = 1;
			}
			this.setCodeStatus(ist_id, 'Correct')
		} else {
			this.sequenceCorrectCodes[ist_id] = 0;
		}

		if (parseInt(this.repetitions) <= parseInt(this.sequenceCorrectCodes[ist_id])){
			this.setCodeStatus(ist_id, 'Finished')
		}

	} finally {
		release();
	}


}

Code.prototype.validateCode = function(code_client, ist_id){
	if(!(ist_id in this.studentsCodes))
		return (this.current_code === code_client && this.current_code !== "")
	else
		return (this.current_code === code_client && this.current_code !== "" && !(this.studentsCodes[ist_id].includes(code_client)));
}

Code.prototype.insertStudentIntoAttendance = function(ist_id, callback) {
	const that = this;
	this.db.insertIntoAttendanceHistory(this.attendanceID, ist_id,
		function (err, rows){
			if (err)
				callback(err)
			else {
				that.db.insertConfidence(that.attendanceID, ist_id, that.getStudentConfidence(ist_id), function(err1, rows1){ //confidence level = time taken todo change db
					if (err1) callback(err1)
					else {
						that.db.insertCode(ist_id, that.studentsCodes[ist_id][0], that.studentsCodes[ist_id][0], that.getStudentConfidence(ist_id), null, that.attendanceID,
							function(err2, code_input){
								if (err2) callback(err2)
								else callback(err2, rows)
							})
					}
				})
			}
		}
	)
}

Code.prototype.insertStudent = function(ist_id){
	if(!this.studentsList.includes(ist_id)){
		this.studentsList.unshift(ist_id);
	}
}

function initStream(filename) {
	var exists = false;
	try {
		fs.accessSync(filename, fs.constants.R_OK | fs.constants.W_OK);
		exists = true;
	} catch (err) {
		exists = false;
	}
	var stream = fs.createWriteStream(filename, {flags:'a'});
	if(exists == false) {
		stream.write("Date" + CSV_SEPARATOR +
			"Total_time_s" + CSV_SEPARATOR +
			"Code_length" + CSV_SEPARATOR +
			"Code_type" + CSV_SEPARATOR +
			"Code_generated" + CSV_SEPARATOR +
			"Code_input" + CSV_SEPARATOR +
			"Correct" + CSV_SEPARATOR +
			"Time_left_s" + "\n"
		);
	}
	return stream;
}


function appendToFile(rows) {
	stream.write( + CSV_SEPARATOR +
		this.INTERVAL/1000 + CSV_SEPARATOR +
		this.NUM_CHAR + CSV_SEPARATOR +
		this.CODE_TYPE + CSV_SEPARATOR +
		this.current_code + CSV_SEPARATOR +
		code_client + CSV_SEPARATOR +
		validateCode(code_client) + CSV_SEPARATOR +
		this.time_ms/1000 + "\n"
	);
}

Code.prototype.insertStudentsThatDidNotFinish = async function (callback) {

	const release = await this.writeCodeMutex.acquire();
	try {
		let student_ids = Object.keys(this.codeState);

		const that = this;
		student_ids.forEach(function(ist_id){
			if (that.codeState[ist_id] !== 'Finished' && that.studentsCodes[ist_id].length > 0) {
				that.db.insertCode(ist_id, that.studentsCodes[ist_id][0], that.studentsCodes[ist_id][0], 0, null, that.attendanceID,
					function(err, code_input){

						if (err) callback(err)
						else callback(err, code_input)
					})
			}
		});
	} finally {
		release();
	}
}

Code.prototype.insertConfidence = async function(ist_id, level){
	const release = await this.writeConfidente.acquire();
	try {
		this.setStudentConfidence(ist_id, level);
	} finally {
		release();
	}
}

async function loadStudentsName(db, Code, callback){
	let studentsName  = {} // ist_id: name
	await db.getStudentsName(function(err, rows){
		for (let i = 0; i < rows.length; ++i){
			if (rows[i]['name'])
			studentsName[rows[i]['ist_id']] = rows[i]['name'].split(' ')[0] + ' ' + rows[i]['name'].split(' ')[rows[i]['name'].split(' ').length-1]
		}
		callback(Code, studentsName)
	})
}

module.exports = Code;
