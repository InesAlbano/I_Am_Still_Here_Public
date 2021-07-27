var mysql = require('mysql');
var crypto = require('crypto');
var moment = require('moment');

var database = function(connectionLimit, host, user, password, database) {
	this.pool = mysql.createPool({
		connectionLimit 	: connectionLimit,
		host				: host,
		user 				: user,
		password 			: password,
		database 			: database

});
}

//database.prototype.getConnection(func) 
//checkLogin

database.prototype.insertUser = function(user_id, access_token, refresh_token, name, callback) {
	let sql = "INSERT INTO User (ist_id, access_token, refresh_token, name, iamhere_token, creation) VALUES (?,?,?,?,?,?) \
	ON DUPLICATE KEY UPDATE access_token = ?, refresh_token = ?, name = ?, iamhere_token =?, creation = ?;";
	var iamhere_token = randomInt(32);
	var creation = moment().format('YYYY-MM-DD HH:mm:ss');
	let args = [user_id, access_token, refresh_token, name, iamhere_token, creation,
					access_token, refresh_token, name, iamhere_token, creation];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in the insertion of a user:", err);
			callback(err);
		}
		else{
			callback(err, iamhere_token);
		}
	});
}

database.prototype.isProfessor = function(ist_id, callback) {
	let sql = "SELECT ist_id from Professor WHERE ist_id = ?";
	let args = [ist_id];

	this.pool.query(sql, args, function (err, rows, fields) {
		if (err){
			console.log("Error verifying if is professor", err);
			callback(err);
		}
		else {
			callback(err, rows.length > 0);
		}
	});

}

database.prototype.getShiftsByCourseID = function(courseID, callback) {
	let sql = "SELECT * from Shift WHERE courseID = ?";
	let args = [courseID];

	this.pool.query(sql, args, function (err, rows, fields) {
		if (err){
			console.log("Error getting shifts information by courseID.", err);
			callback(err);
		}
		else {
			callback(err, rows);
		}
	});

}

database.prototype.getShiftsInfo = function(shiftid, callback) {
	let sql = "SELECT * from Shift WHERE shift_id = ?";
	let args = [shiftid];

	this.pool.query(sql, args, function (err, rows, fields) {
		if (err){
			console.log("Error getting shifts information by shiftid.", err);
			callback(err);
		}
		else {
			callback(err, rows[0]);
		}
	});

}


database.prototype.getStudentsByCourseID = function(courseID, callback) {
	let sql = "SELECT ist_id from StudentsEnrolled WHERE courseID = ?";
	let args = [courseID];

	this.pool.query(sql, args, function (err, rows) {
		if(err){
			console.log("Error getting ist_id by courseID.", err);
			callback(err);
		}
		else {
			callback(err, rows);
		}
	});

}


database.prototype.insertProfessorandCourse = function(ist_id, courseID, courseName, academicTerm, fenix_id, callback) {
	var date = moment().format('YYYY-MM-DD HH:mm:ss');
	var secret = randomInt(16);
	let sql = "CALL InsertProfessorandCourse(?,?,?,?,?,?,?);";
	let args = [ist_id, courseID, courseName, academicTerm, fenix_id, date, secret];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in the insertion of a professor and course:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.insertStudentsEnrolled = function(studentsenrolled, callback) {
	let sql = "INSERT IGNORE INTO StudentsEnrolled(ist_id, courseID) VALUES ?;";

	this.pool.query(sql, [studentsenrolled], function (err, result) {
		if (err){
			console.log("Error in the insertion of student's enrolled:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.setCourseToInUse = function(ist_id, courseID, callback) {
	let sql = "CALL SetCourseToInUse(?,?);";
	let args = [ist_id, courseID];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in setCourseToInUse:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.insertManuallyProfessor = function(ist_id, courseID, callback) {
	let sql = "CALL InsertProfessorToSystem(?,?);";
	let args = [ist_id, courseID];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in insertManuallyProfessor:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}


database.prototype.insertacademicterm = function(academicterm, callback) {
	let sql = "INSERT INTO AcademicTerms (academicTerm) VALUES (?);";
	let args = [academicterm];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in insertacademicterm:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.updateStudentStatus = function(totalComplete, specificComplete, specificLate, specificEarly, courseID, shiftID, classNumber, callback) {
	let sql = "REPLACE INTO StudentStatus (courseID, shiftID, classNumber, totalComplete, specificComplete, specificLate, specificEarly) VALUES (?,?,?,?,?,?,?);";
	let args = [courseID, shiftID, classNumber, totalComplete, specificComplete, specificLate, specificEarly];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in updateStudentStatus:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.updateFixedThresh = function(courseID, shiftID, classNumber, type, failed, ok, callback){
	let sql, args
	console.log(courseID, shiftID, classNumber, type, failed, ok, )
	if (type === 'apply_course'){
		sql = "UPDATE Threshold SET failed=?, ok=? WHERE courseID=?;"
		args = [failed, ok, courseID];
	} else if (type === 'apply_shift') {
		sql = "UPDATE Threshold SET failed=?, ok=? WHERE courseID=? and shiftID=?";
		args = [failed, ok, courseID, shiftID];
	} else if (type === 'apply_class'){
		sql = "UPDATE Threshold SET failed=?, ok=? WHERE courseID=? and shiftID=? and classNumber=?";
		args = [failed, ok, courseID, shiftID, classNumber];
	} else {
		sql = "REPLACE INTO Threshold (courseID, shiftID, classNumber, failed, ok) \
		VALUES (?,?,?,?,?);";
		args = [courseID, shiftID, classNumber, failed, ok];
	}

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in updateFixedThresh:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.updateFixedWeight = function(courseID, shiftID, classNumber, useragent, ip, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, sessionStorage, localStorage, platform, plugins, fonts, audio, gpu, adBlock, pixelDepth, future,  callback) {
	let sql = "REPLACE INTO IndicatorFixedWeight (courseID, shiftID, classNumber, useragent, ip, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, sessionStorage, localStorage, platform, plugins, fonts, audio, gpu, adBlock, pixelDepth, future) \
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
	let args = [courseID, shiftID, classNumber, useragent, ip, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, sessionStorage, localStorage, platform, plugins, fonts, audio, gpu, adBlock, pixelDepth, future];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in updateFixedWeight:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.updateConfidenceWeight = function(courseID, shiftID, classNumber, fp_percent, gps_percent, future, callback) {
	let sql = "REPLACE INTO ConfidenceWeight (courseID, shiftID, classNumber, fp_percentage, gps_percentage, future) \
		VALUES (?,?,?,?,?,?);";
	let args = [courseID, shiftID, classNumber, fp_percent, gps_percent, future];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in updateConfidenceWeight:", err);
			callback(err);
		}
		else{
			callback(err);
		}
	});
}

database.prototype.getConfidenceWeight = function(courseID, shiftID, classNumber, callback) {
	let sql = "SELECT fp_percentage, gps_percentage FROM ConfidenceWeight WHERE courseID=? and shiftID=? and classNumber=?;";
	let args = [courseID, shiftID, classNumber];

	this.pool.query(sql, args, function (err, rows) {
		if (err){
			console.log("Error in getConfidenceWeight:", err);
			callback(err);
		}
		else{
			callback(err,rows);
		}
	});
}


database.prototype.getStudentStatus = function(courseID, shiftID, classNumber, callback) {
	let sql = "SELECT * FROM StudentStatus WHERE courseID=? and shiftID=? and classNumber=?";
	let args = [courseID, shiftID, classNumber];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in getStudentStatus:", err);
			callback(err);
		}
		else{
			if (result.length > 0)
				callback(err, result[0]);
			else
				callback(err, result);
		}
	});
}

database.prototype.getfixedFingerprintWeight = function(courseID, shiftID, classNumber, callback) {
	let sql = "SELECT * FROM IndicatorFixedWeight WHERE courseID=? and shiftID=? and classNumber=?";
	let args = [courseID, shiftID, classNumber];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in getfixedFingerprintWeight:", err);
			callback(err);
		}
		else{
			if (result.length > 0)
				callback(err, result[0]);
			else
				callback(err, result);
		}
	});
}

database.prototype.getFixedThresh = function(courseID, shiftID, classNumber, callback) {
	let sql = "SELECT failed, ok FROM Threshold WHERE courseID=? and shiftID=? and classNumber=?";
	let args = [courseID, shiftID, classNumber];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in getFixedThresh:", err);
			callback(err);
		}
		else{
			if (result.length > 0)
				callback(err, result[0]);
			else
				callback(err, result);
		}
	});
}

database.prototype.getPreviousFutureFingerprintWeight = function(courseID, callback) {
	let sql = "SELECT * FROM IndicatorFixedWeight WHERE courseID=? and future=?";
	let args = [courseID, true];

	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in getPreviousFutureFingerprintWeight:", err);
			callback(err);
		}
		else{
			if (result.length > 0)
				callback(err, result[result.length-1]);
			else
				callback(err, null);
		}
	});
}

database.prototype.updateAccessToken = function(access_token, refresh_token, newAccessToken, callback) {
	let sql = "UPDATE User SET access_token = ? WHERE access_token = ? AND refresh_token = ?;";
	let args = [newAccessToken, access_token, refresh_token];
	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in the insertion of a new access token.");
			callback(err);
		}
		else{
			callback(err, newAccessToken);
		}
	});
}

database.prototype.updateStudentNameAndNumber = function(short_name, std_number, ist_id, courseID, callback) {
	let sql = "Call InsertStudent(?,?,?,?)";
	let args = [short_name, std_number, ist_id, courseID];
	this.pool.query(sql, args, function (err, result) {
		if (err){
			console.log("Error in updateStudentNameAndNumber (database).",err);
		}
		callback(err);
	});
}

database.prototype.getUserByToken = function(iamhere_token, callback) {
	let sql = "SELECT ist_id FROM User WHERE iamhere_token = ?;";
	var arg = [iamhere_token];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the ist_id.");
			callback(err);
		}
		else if(rows.length < 1) {
			console.log("getUserByToken: empty row.", rows);
			callback(err);
		}
		else {
			callback(err, rows[0].ist_id);
		}
	})
};

database.prototype.getFenixIDByCourseID = function(courseID, callback) {
	let sql = "SELECT fenix_id FROM Course WHERE courseID = ?;";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the fenix_id by courseID.");
			callback(err);
		}
		else {
			callback(err, rows[0].fenix_id);
		}
	})
};

database.prototype.getUserName = function(ist_id, callback) {
	let sql = "SELECT name FROM User WHERE ist_id = ?";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the user name.");
			callback(err);
		}
		else{
			callback(err, rows[0].name);
		}
	})
};


database.prototype.getisAdmin = function(ist_id, callback) {
	let sql = "SELECT role FROM User WHERE ist_id = ?";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the user admin.");
			callback(err);
		}
		else{
			callback(err, rows[0].role);
		}
	})
};

database.prototype.getProfessorsByCourse = function(courseID, callback) {
	let sql = "select p.ist_id, u.name from ProfessorTeachesCourse p\
					join User u\
				    on u.ist_id = p.ist_id\
				    where courseID = ?;";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the professors by course ID.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};

database.prototype.getStudentsByCourse = function(courseID, callback) {
	let sql = "select DISTINCT ah.ist_id from AttendanceHistory ah\
					join Attendance a\
				    on ah.attendanceID = a.attendanceID\
				    where courseID = ?;";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the professors by course ID.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};

database.prototype.getShiftsByCourse = function(courseID, callback) {
	let sql = "select DISTINCT shift_id from Shift where courseID = ?;";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the shifts by course ID.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};

database.prototype.getAttedancesbyClassNumber = function(courseN, courseID, shiftID, callback) {
	let sql = "select count(DISTINCT ah.attendanceID) as count from AttendanceHistory ah, Attendance a \
		where ah.attendanceID=a.attendanceID and a.number=? and a.courseID=? and a.shift_id=?;";
	var arg = [courseN, courseID, shiftID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getAttedancesbyClassNumber");
			callback(err);
		}
		else{
			callback(err, rows[0]['count']);
		}
	})
};


database.prototype.getFingerprintDataTable = function(attendanceID, callback) {
	let sql = "SELECT ist_id, ip FROM FingerprintData WHERE attendanceID = ?";
	var arg = [attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the fingerprint table.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};

database.prototype.getManuallyInsertedStudents = function(attendanceID, callback) {
	let sql = "SELECT ist_id FROM AttendanceHistory WHERE attendanceID = ? and manually = 1";
	var arg = [attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the manually inserted students.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};

database.prototype.insertConfidence = function(attendanceID, ist_id, flagLevel, callback) {
	//console.log(attendanceID, ist_id, flagLevel)
	let sql = "UPDATE AttendanceHistory SET confidence = ? WHERE attendanceID=? and ist_id=?";
	var arg = [flagLevel, attendanceID, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the manually inserted students.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};


database.prototype.getLateStudents = function(attendanceID, callback) {
	let sql = "SELECT ist_id FROM AttendanceHistory WHERE attendanceID = ? and late = 1";
	var arg = [attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting the late students.");
			callback(err);
		}
		else{
			callback(err, rows);
		}
	})
};

database.prototype.removeIAmHereToken = function(ist_id, callback) {
	let sql = "UPDATE User SET iamhere_token = null WHERE ist_id = ?;";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error updating the iamhere_token.");
			callback(err, false);
		}
		else{
			callback(err, true);
		}
	})
};


database.prototype.closeAttendance = function(randomID, callback) {
	let sql = "UPDATE Attendance SET open = false WHERE randomID = ?;";
	var arg = [randomID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error closing Attendance.");
			callback(err, false);
		}
		else{
			console.log("Attendance closed.");
			callback(err, true);
		}
	})
};

database.prototype.generateRandomAttendanceCode = function(ist_id, randomID, code_type, code_length, total_time_s, consecutive_codes, courseID, is_extra, title, number, shift, requiresAccess, attendance_checks, attendance_number, remote, callback) {
	if (!attendance_number)
		attendance_number = 1

	let sql = "CALL AttendanceMapping(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
	var date = moment().format('YYYY-MM-DD HH:mm:ss');
	var secret = randomInt(16);
	var arg = [ist_id, randomID, code_type, code_length, total_time_s, consecutive_codes, date, true, courseID, is_extra, title, number, shift, requiresAccess, secret, attendance_checks, attendance_number, remote];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error updating the randomID.", err);
			callback(err);
		}
		else{
			callback(err, rows[0][0].attendanceID);
		}
	})
};

 database.prototype.insertCode = function(ist_id, code_generated, code_input, time_taken_s, sequence, attendanceID, callback) {
	let sql = "INSERT INTO Code(date_input, ist_id, code_input, correct, time_taken_s, sequence, attendanceID) VALUES(?,?,?,?,?,?,?);";
	var correct = (code_generated == code_input);

	var arg = [moment().format('YYYY-MM-DD HH:mm:ss'), ist_id, code_input, correct, time_taken_s, sequence, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting code:", err);
		}
		else{
		}
		callback(err, code_input);
	})
};

database.prototype.insertCodeServer = function(server_code, sequence, attendanceID, callback) {
	let sql = "INSERT INTO CodeAttendance(server_code, sequence, attendanceID) VALUES(?,?,?)";
	var arg = [server_code, sequence, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.insertCourseShiftInfo = function(fenix_id, shift_id, type, week_day, start, end, campus, room, courseID, callback) {
	var secret = randomInt(16);
	let sql = "INSERT IGNORE INTO Shift (fenix_id, shift_id, type, week_day, start, end, campus, room, courseID, secret)\
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
	var arg = [fenix_id, shift_id, type, week_day, start, end, campus, room, courseID, secret];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting course shifts information.");
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.addCourseShiftInfo = function(fenix_id, shift_id, type, week_day, start, end, campus, room, courseID, prof_id, codetype, codelength, consecutive, time, callback) {
	let secret = randomInt(16);
	let sql = "INSERT IGNORE INTO Shift (fenix_id, shift_id, type, week_day, start, end, campus, room, courseID, secret, prof_id, codetype, codelength, time, consecutive)\
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?);";
	var arg = [fenix_id, shift_id, type, week_day, start, end, campus, room, courseID, '' + secret, prof_id, codetype, codelength, time, consecutive];
	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting course shifts information.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};


database.prototype.updateCourseShiftInfo = function(shift_id, type, week_day, start, end, campus, room, courseID, prof_id, codetype, codelength, consecutive, time, callback) {
	let sql = "UPDATE Shift SET type = ?, week_day = ?, start = ?, end = ?, campus = ?, room = ?, prof_id = ?, codetype = ?, codelength = ?, time = ?, consecutive = ? WHERE shift_id = ? and courseID = ?;"

	var arg = [type, week_day, start, end, campus, room, prof_id, codetype, codelength, time, consecutive, shift_id, courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error updating course shifts information.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.updateCourseShiftInfoCodes = function(courseID, codetype, codelength, consecutive, time, callback) {
	let sql = "UPDATE Shift SET codetype = ?, codelength = ?, time = ?, consecutive = ? WHERE courseID = ?;"

	var arg = [codetype, codelength, time, consecutive, courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error in updateCourseShiftInfoCodes.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.updateCourse = function(courseID, courseName, academicTerm, code_type, code_length, consecutivecodes, time, callback) {
	let sql = "UPDATE Course SET courseName = ?, academicTerm = ?, codetype = ?, codelength = ?, time = ?, consecutive = ? WHERE courseID = ?;"

	var arg = [courseName, academicTerm, code_type, code_length, time, consecutivecodes, courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error updating course information.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.insertFingerprintData = function(ist_id, useragent, ip, attendanceID, callback) {
	//let sql = "INSERT INTO FingerprintData(ist_id, useragent, ip, attendanceID) VALUES(?,?,?,?);";
	let sql = "CALL InsertFingerprint(?,?,?,?);"
	var arg = [attendanceID, ist_id, ip, useragent];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting fingerprintdata.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.insertFingerprinHistory = function(my_ist_id, my_indicator, my_value, my_weight, callback) {
	let sql = "INSERT INTO FingerprintHistory(ist_id, indicator_id, indicator_value, indicator_weight) VALUES (?,?,?,?);"
	var arg = [my_ist_id, my_indicator, my_value, my_weight];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting fingerprintdata.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.manuallyInsertStudent = function(ist_id, attendanceID, callback) {
	let sql = "CALL InsertStudentToAttendance(?,?)";
	var arg = [ist_id, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting student manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.getConfidenceLevel = function(ist_id, attendanceID, callback) {
	let sql = "Select time_taken_s FROM Code where ist_id=? and attendanceID=?";
	var arg = [ist_id, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error in getConfidenceLevel", err);
			callback(err);
		}
		else{
			callback(err, (rows.length > 0 ? rows[0]['time_taken_s'] : -1)); //time_taken_s is confidence
		}
	})
};

database.prototype.copyConfidenceCodeToConfidenceAttendance = function(ist_id, attendanceID, confidence, callback) {
	let sql = "UPDATE AttendanceHistory SET confidence = ? WHERE ist_id = ? and attendanceID = ?;";
	var arg = [confidence, ist_id, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error in copyConfidenceCodeToConfidenceAttendance.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.manuallyInsertLateStudent = function(ist_id, attendanceID, callback) {
	let sql = "CALL InsertLateStudentToAttendance(?,?)";
	var arg = [ist_id, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error inserting student manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.manuallyRemoveStudent = function(ist_id, attendanceID, callback) {
	//let sql = "CALL RemoveStudentFromAttendance(?,?)";
	let sql = "CALL RemoveStudentFromAttendance(?,?)";
	var arg = [ist_id, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing student manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.manuallyRemoveShift = function(shift_id, callback) {
	let sql = "DELETE FROM Shift WHERE shift_id = ?;"
	var arg = [shift_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing shift manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};


database.prototype.manuallyRemoveCourse = function(courseID, callback) {
	let sql = "DELETE FROM Course WHERE courseID = ?;"
	let arg = [courseID,courseID, courseID, courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing course manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};
// DELETE FROM StudentsEnrolled WHERE courseID = ?; DELETE FROM Class WHERE courseID = ?; DELETE FROM Course WHERE courseID = ?;
database.prototype.RemovingProfessorTeachesCourse = function(courseID, callback) {
	let sql = "DELETE FROM ProfessorTeachesCourse WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing ProfessorTeachesCourse", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.RemovingStudentsEnrolled = function(courseID, callback) {
	let sql = "DELETE FROM StudentsEnrolled WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing StudentsEnrolled", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.RemovingClass = function(courseID, callback) {
	let sql = "DELETE FROM Class WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing Class", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

//-------
database.prototype.RemovingShiftByCourseID = function(courseID, callback) {
	let sql = "DELETE FROM Shift WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing Shift", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.RemovingAttendanceByCourseID = function(courseID, callback) {
	let sql = "DELETE FROM Attendance WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing Attendance", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.RemovingStudentStatusByCourseID = function(courseID, callback) {
	let sql = "DELETE FROM StudentStatus WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing StudentStatus", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.RemovingIndicatorFixedWeightByCourseID = function(courseID, callback) {
	let sql = "DELETE FROM IndicatorFixedWeight WHERE courseID = ?;"
	let arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing IndicatorFixedWeight", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};



database.prototype.manuallyremoveacademicterm = function(academicterm, callback) {
	let sql = "DELETE FROM AcademicTerms WHERE academicTerm = ?;"
	let arg = [academicterm];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error manuallyremoveacademicterm.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.removeProfessorFromCourse = function(ist_id, courseID, callback) {
	let sql = "DELETE FROM ProfessorTeachesCourse WHERE ist_id =  ? and courseID = ?;";
	var arg = [ist_id, courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing professor from course.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};


var remove = 0;
var add = 1;
database.prototype.updateAdmin = function(ist_id, op, callback) {
	let sql, arg;
	if (op === remove) {
		sql = "UPDATE User SET role=null WHERE ist_id=?;";
		arg = [ist_id];
	} else if (op === add) { // Um admin vai ser considerado professor, contudo isto tem que mudar TODO
		sql = "UPDATE User SET role=1 WHERE ist_id=?;";
		arg = [ist_id];
	}

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error updating admin.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.updateProfessor = function(ist_id, op, callback){
	let sql
	let arg
	if (op === 'add') {
		sql = "INSERT INTO Professor(ist_id) VALUES (?);"
		arg = [ist_id];
	}

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error updating Professor.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
}


database.prototype.manuallyRemoveAttendance = function(classNumber, courseID, shiftID, callback) {
	//let sql = "CALL RemoveAttendanceFromProfessor(?,?,?,?)";
	let sql = "UPDATE Attendance SET removed = 1 WHERE courseID = ? and shift_id = ? and number = ?;";

	var arg = [courseID, shiftID, classNumber];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing attendance manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.manuallyUpdateAttendance = function(classNumber, courseID, shiftID, new_number, new_title, callback) {
	//let sql = "CALL RemoveAttendanceFromProfessor(?,?,?,?)";
	let sql = "UPDATE Attendance SET number = ?, title = ? WHERE courseID = ? and shift_id = ? and number = ?;";

	var arg = [new_number, new_title ,courseID, shiftID, classNumber];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error removing attendance manually.", err);
			callback(err);
		}
		else{
			callback(err);
		}
	})
};

database.prototype.checkFingerprint = function(attendanceID, callback) {
	let sql = "CALL CheckFingerprint(?);";
	var arg = [attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error checking fingerprint", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getFingerprintData = function(ist_id, attendanceID, callback) {
	let sql = "CALL GetFingerprintInfo(?,?);";
	var arg = [ist_id, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting fingerprint data", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getFingerprintHistory = function(ist_id, callback) {
	let sql = "SELECT * FROM FingerprintHistory WHERE ist_id=?;";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows) {
		if (err){
			console.log("Error getting fingerprint data", err);
			callback(err);
		}
		else{

			callback(err, rows);
		}
	})
};



database.prototype.createClass = function(ist_id, courseID, callback) {
	let sql = "INSERT INTO Class(ist_id, courseID) VALUES (?,?);";
	var arg = [ist_id, randomID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in createClass:", err);
			callback(err);
		} else {
			callback(err);
		}
	})
};

database.prototype.getCourseName = function(courseID, callback) {
	let sql = "SELECT courseName, secret from Course where courseID = ?";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getCourseName:", err);
			callback(err);
		} else {
			callback(err, rows[0]);
		}
	})
};

database.prototype.getAttendanceHistory = function(ist_id, courseID, shift, callback) {

	let sql = "SELECT date, a.number, a.code_type, a.code_length, a.total_time_s, a.consecutive_codes, a.attendanceID, c.courseName, a.title, a.is_extra, a.secret, a.remote, \
					count(distinct ah.ist_id) as count FROM Attendance a, AttendanceHistory ah , Course c \
					WHERE a.ist_id = ? and a.attendanceID = ah.attendanceID AND a.courseID = ? \
						AND c.courseID = a.courseID AND a.shift_id = ? AND a.removed=0 \
					group by a.attendanceID";
	var arg = [ist_id, courseID, shift, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceHistory:", err);
			callback(err);
		} else {
			var res = {};
			res.rows = rows;
			res.ist_id = ist_id;
			callback(err, res);
		}
	})
};

database.prototype.getNumStudentsForClass = function(courseID, shift, callback) {
	let sql = "select count(distinct ah.ist_id) as count, a.number\
        From AttendanceHistory ah, Attendance a\
        where a.courseID=? and a.shift_id=? and a.attendanceID=ah.attendanceID group by a.number;";
	var arg = [courseID, shift];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getNumStudentsForClass:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};


database.prototype.getStudentsThatTried = function(attendanceID, courseID, shiftID, classnumber, callback) {
	let sql = " SELECT distinct c.ist_id, u.name, c.attendanceID, a.numberAttendance \
				FROM Code c, Attendance a, User u \
				WHERE a.courseID = ? and a.shift_id = ? and a.number = ? and c.attendanceID=a.attendanceID and u.ist_id=c.ist_id \
				and not exists \
			    (select ah.ist_id from AttendanceHistory ah, Attendance ab \
				where ab.attendanceID=ah.attendanceID \
				and ab.courseID=? \
				and ab.shift_id=? \
                and ab.number=? \
				and ah.success=1 \
				and ah.ist_id=c.ist_id\
				and c.attendanceID=ah.attendanceID);"
	var arg = [courseID, shiftID, classnumber, courseID, shiftID, classnumber]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsThatTried:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAttendanceByRandomID = function(randomID, ist_id, callback) {
	let sql = "select * from Attendance WHERE randomID = ? AND ist_id = ?;";
	var arg = [randomID, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceByRandomID:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAttendanceByRandomCode = function(randomID, callback) {
	let sql = "select attendanceID from Attendance WHERE randomID = ?;";
	let arg = [randomID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceByCourseIDAttendanceNumber:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.deserializedAttendancesFromLastDay = function(callback) {
	let sql = "SELECT * from Attendance where open = 1 and date >= DATE(NOW()) - INTERVAL 1 DAY;";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in deserializedAttendancesFromLastDay:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAttendanceSequence = function(callback) {
	let sql = "select attendanceID, sequence \
					from (select attendanceID, sequence from CodeAttendance order by attendanceID, sequence desc) x \
					group by attendanceID;";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceSequence:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAttendanceByRandomIDWithoutISTID = function(randomID, callback) {
	let sql = "select * from Attendance WHERE randomID = ?;";
	var arg = [randomID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceByRandomIDWithoutISTID", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getClassHistory = function(classnumber, courseID, shiftID, callback) {
	let sql = "SELECT ah.ist_id, u.name, a.number, ah.attendanceID, a.numberAttendance, ah.late from AttendanceHistory ah, Attendance a, User u WHERE a.number = ? and courseID = ? and shift_id = ? and ah.attendanceID = a.attendanceID  and u.ist_id = ah.ist_id;";
	var arg = [classnumber, courseID, shiftID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getClassHistory:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAllAcademicTerms = function(ist_id, callback) {
	let sql = "select distinct c.academicTerm from ProfessorTeachesCourse as p \
				join Course c  \
					on c.courseID = p.courseID \
				where p.ist_id = ?;";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAllAcademicTerms:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getExistingAcademicTerms = function(callback) {
	let sql = "select distinct * from AcademicTerms;";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getExistingAcademicTerms:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getExistingCourses = function(callback) {
	let sql = "select courseID, courseName, academicTerm, codetype, codelength, consecutive, time from Course;";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getExistingCourses:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.selectCourseInfo = function(ist_id, academicTerm, callback) {
	let sql = "select c.courseName, c.courseID, c.academicTerm from ProfessorTeachesCourse as p \
					join Course c  \
						on c.courseID = p.courseID \
					where p.ist_id = ? \
						and c.academicTerm = ? \
                        and p.in_use = 1;";
	var arg = [ist_id, academicTerm];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in selectCourseInfo:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.studentAttendanceChecked = function(ist_id, randomID, callback) {
	let sql = "SELECT ah.ist_id FROM AttendanceHistory ah, Attendance a WHERE a.randomID = ? AND a.attendanceID = ah.attendanceID AND ah.ist_id = ?;";
	var arg = [randomID, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in studentAttendanceChecked.", err);
			callback(err);
		} else {
			callback(err, rows.length > 0);
		}
	})
};

database.prototype.verifyAttendance = function (ist_id, attendanceID, consecutive_codes, callback) {
	let sql = "SELECT CheckAttendance(?,?,?) AS result";
	var arg = [attendanceID, ist_id, consecutive_codes];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in verifyAttendance:", err);
			callback(err);
		} else {
			callback(err, rows[0].result);
		}
	})
};


function randomInt(size){
	return crypto.randomBytes(size).toString('hex');
};

database.prototype.getAttendances = function(callback) {
	let sql = "CALL ShowAttendances();";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting attendances data", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getAttendancesByCourseSecret = function(secret, callback) {
	let sql = "CALL GetAttendances(?);";
	var arg = [secret];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting all attendances data", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getAttendancesByShiftSecret = function(secret, callback) {
	let sql = "CALL GetShiftAttendances(?);";
	var arg = [secret];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting all attendances data", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getAttendancesByClassSecret = function(secret, callback) {
	let sql = "CALL GetClassAttendances(?);";
	var arg = [secret];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting all attendances data", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getAttendancesByCourseProfessorClass = function(courseID, ist_id, attendanceID, shift, callback) {
	let sql = "CALL GetAttendanceInformation(?,?,?,?);";
	var arg = [courseID, ist_id, attendanceID, shift];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if (err){
			console.log("Error getting all attendances data", err);
			callback(err);
		}
		else{
			callback(err, rows[0]);
		}
	})
};

database.prototype.getStudentAttendanceHistory = function(ist_id, callback) {
	let sql = "select distinct a.number, ah.late \
				from Attendance a \
					join AttendanceHistory ah \
						on ah.attendanceID = a.attendanceID \
				where ah.success = 1 \
						and ah.ist_id = ?;";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in selectCourseInfo:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getPCM2021AttendanceFlow = function(callback) {
	let sql = "select a.number, count(distinct ah.ist_id) \
				from Attendance a \
					join AttendanceHistory ah \
						on ah.attendanceID = a.attendanceID \
				where a.number is not null \
				group by a.number;";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getPCM2021AttendanceFlow", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAllUsers = function(callback) {
	let sql = "Select ist_id, name, role from User;";
	var arg = [];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAllUsers", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAllFingerprintData = function(attendanceID, courseID, ist_id, callback){
	let sql = "SELECT * FROM FingerprintData fp, Attendance a WHERE fp.attendanceID=a.attendanceID and a.courseID=? and a.attendanceID<=? and fp.ist_id=?;";
	var arg = [courseID, attendanceID, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAllFingerprintData", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}


database.prototype.getAttendanceFlow = function(courseID, callback) {
	let sql = "select distinct u.ist_id, u.name, count(distinct a.number) as count, co.courseName \
				 from User u \
		         inner join AttendanceHistory ah\
		                    on ah.ist_id = u.ist_id \
		         inner join Attendance a \
		                    on a.attendanceID = ah.attendanceID \
		         inner join Course co \
		                    on co.courseID = a.courseID \
				where a.courseID = ? \
				  and a.removed=0 \
				group by ah.ist_id;";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceFlow", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getAttendedClasses = function(courseID, ist_id, callback) {
	let sql = "select distinct a.number as class\
				from AttendanceHistory ah\
						 inner join Attendance a\
									on a.attendanceID = ah.attendanceID\
				where a.courseID = ?\
				  and a.removed = 0\
				  and ah.ist_id = ?;";
	var arg = [courseID, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendedClasses", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};


database.prototype.getMaxNclass = function(courseID, callback) {
	let sql = "SELECT distinct number as class FROM Attendance WHERE courseID=?";
	var arg = [courseID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getMaxNclass", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getInactiveCourses = function(ist_id, callback) {
	let sql = "select c.courseName, c.CourseID from ProfessorTeachesCourse as p\
				join Course c\
					on c.courseID = p.courseID \
				where p.ist_id = ?\
					and c.academicTerm = '2º Semestre 2019/2020'  \
					and p.in_use != 1;";
	var arg = [ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getInnactiveCourses", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.setLate = function(attendanceID, ist_id, isLate, callback) {
	let sql = "Call setLate(?,?,?);";
	var arg = [attendanceID, ist_id, isLate];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in setLate", err);
			callback(err);
		} else {
			callback(err);
		}
	})
};

database.prototype.updateCanvasFP = function(randomID, ist_id, canvas, callback){
	let that = this;
	this.getAttendanceByRandomIDWithoutISTID(randomID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {

				let sql = "UPDATE FingerprintData SET canvas=? WHERE attendanceID=? and ist_id=?;";
				let attendanceID = rows[0].attendanceID;
				var arg = [canvas, attendanceID, ist_id];

				that.pool.query(sql, arg, function(err, rows, fields) {
					if(err) {
						console.log("Error in updateCanvasFP", err);
						callback(err, rows);
					} else {
						callback(err, rows);
					}
				})
			}
		})
}

database.prototype.updateFingerprintData = function(randomID, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, timezoneOffset, sessionStorage, localStorage, platform, plugins, pixelDepth, adBlock, fonts, audio, gpu, accurLat1, accurLat2, accurLat3, accurLat4, accurLat5, accurLong1, accurLong2, accurLong3, accurLong4, accurLong5, accur, ist_id, callback) {

	let that = this;

	this.getAttendanceByRandomIDWithoutISTID(randomID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				let sql = "Call updateFingerprintData(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
				let attendanceID = rows[0].attendanceID;
				var arg = [attendanceID, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution,availableScreenResolution, timezoneOffset, sessionStorage, localStorage, platform, plugins,pixelDepth, adBlock, fonts, audio, gpu, accurLat1, accurLat2, accurLat3, accurLat4, accurLat5, accurLong1, accurLong2, accurLong3, accurLong4, accurLong5, accur, ist_id];

				that.pool.query(sql, arg, function(err, rows, fields) {
					if(err) {
						console.log("Error in updateFingerprintData", err);
						callback(err, rows);
					} else {
						callback(err, rows);
					}
				})
			}
		})
};

database.prototype.updateFingerprintConfidence = function(attendanceID, ist_id, useragent, ip, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, sessionStorage, localStorage, platform, plugins, fonts, audio, gpu, callback) {
	let sql = "INSERT INTO FingerprintConfidence(attendanceID, ist_id, useragent, ip, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, sessionStorage, localStorage, platform, plugins, fonts, audio, gpu) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
	let arg = [attendanceID, ist_id, useragent, ip, languages, colorDepth, deviceMemory, hardwareConcurrency, screenResolution, availableScreenResolution, sessionStorage, localStorage, platform, plugins, fonts, audio, gpu];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err){
			console.log("Error in updateFingerprintConfidence", err);
			callback(err, rows);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.updateFingerprintDataLocal = function(randomID, accurLat1, accurLat2, accurLat3, accurLat4, accurLat5, accurLong1, accurLong2, accurLong3, accurLong4, accurLong5, accur, ist_id, callback) {
	let that = this;
	this.getAttendanceByRandomIDWithoutISTID(randomID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				let sql = "UPDATE FingerprintData SET accuracyLat1 = ?, \
					accuracyLat2 = ?, \
					accuracyLat3 = ?, \
					accuracyLat4 = ?, \
					accuracyLat5 = ?, \
					accuracyLong1 = ?, \
					accuracyLong2 = ?, \
					accuracyLong3 = ?, \
					accuracyLong4 = ?, \
					accuracyLong5 = ?, \
					accur = ? \
					WHERE attendanceID = ? and ist_id = ?;";
				let attendanceID = rows[0].attendanceID;
				let arg = [accurLat1, accurLat2, accurLat3, accurLat4, accurLat5, accurLong1, accurLong2, accurLong3, accurLong4, accurLong5, accur, attendanceID, ist_id];

				that.pool.query(sql, arg, function(err, rows, fields) {
					if(err) {
						console.log("Error in updateFingerprintData", err);
						callback(err, rows);
					} else {
						callback(err, rows);
					}
				})
			}
		})
};


database.prototype.getNextClassNumber = function(courseID, shift_id, callback) {
	let sql = "SELECT max(number) FROM Attendance WHERE courseID=? and shift_id=?;";
	var arg = [courseID, shift_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getNextClassNumber", err);
			callback(err);
		} else {
			callback(err,  rows[0]);
		}
	})
};

database.prototype.getTitleForMaxClass = function(courseID, shift_id, number, callback) {

	let sql = "SELECT title, is_extra FROM Attendance WHERE courseID=? and shift_id=? and number=?;";
	var arg = [courseID, shift_id, number];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getNextClassNumber", err);
			callback(err);
		} else {
			callback(err,  rows[0]);
		}
	})
};

database.prototype.getAttendanceInformation = function(attendanceID, callback) {
	let sql = "select is_extra, number, title from Attendance where attendanceID = ?;";
	var arg = [attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceInformation:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.updateClassInformation = function(attendanceID, j, callback) {
	let sql = "update Attendance SET is_extra = ?, number = ?, title = ? where attendanceID = ?;";
	var my_is_extra;
	if(j.is_extra === "is_extra") {
		my_is_extra = 1;
	} else {
		my_is_extra = 0;
	}
	var arg = [my_is_extra, j.number, j.mytitle, attendanceID];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in updateClassInformation:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.getStudentsHistoryByClass = function(ist_id, courseID, callback) {
	let sql = "	SELECT distinct * from\
	(SELECT a.number, f.ip, f.useragent, a.shift_id, s.campus\
					FROM FingerprintData f\
					join Attendance a\
							on f.attendanceID = a.attendanceID\
					join Shift s\
						on a.shift_id = s.shift_id\
                            WHERE a.courseID = ? and\
				            f.ist_id = ? and\
				            f.ist_id != 'ist182083'\
				            order by a.attendanceID) as asd;"
	var arg = [courseID, ist_id];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsHistoryByClass:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
};

database.prototype.insertOrUpdateFingerprintHistory = function(ist_id, indicator_id, indicator_value, indicator_weight) {
	let sql = "Call InsertOrUpdateFingerprintHistory(?,?,?,?);";
	var arg = [ist_id, indicator_id, indicator_value, indicator_weight];

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in insertOrUpdateFingerprintHistory", err);
		} else {
		}
	})
}

database.prototype.getStudentsAttended = function(classNumber, callback){
	let sql = " SELECT ah.attendanceID, ah.ist_id, u.name \
		FROM AttendanceHistory ah JOIN Attendance a JOIN User u\
		ON ah.attendanceID = a.attendanceID \
		WHERE a.number = ? and u.ist_id = ah.ist_id;"
	let arg = [classNumber]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsAttended:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}


database.prototype.isFenixCourse = function(courseID, callback){
	let sql = " SELECT fenix_id \
		FROM Course \
		WHERE courseID=?;"
	let arg = [courseID]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsAttended:", err);
			callback(err);
		} else {
			if (rows[0]['fenix_id'] > 0) callback(err, true);
			else callback(err, false)
		}
	})
}

database.prototype.getStudentsAttendedFP = function(classNumber, courseID, shiftID, callback){
	let sql = " SELECT ah.attendanceID, ah.ist_id, u.name, ah.confidence \
		FROM AttendanceHistory ah JOIN Attendance a JOIN User u\
		ON ah.attendanceID = a.attendanceID \
		WHERE a.number = ? and a.courseID=? and a.shift_id=? and u.ist_id = ah.ist_id;"
	let arg = [classNumber, courseID, shiftID]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsAttended:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getAttendanceStudentsLocation = function(course_id, shift_id, class_number, callback){
	let sql = "SELECT  fp.ist_id, fp.attendanceID, fp.accuracyLat1, fp.accuracyLat2, fp.accuracyLat3, fp.accuracyLat4, fp.accuracyLat5, fp.accuracyLong1, fp.accuracyLong2, fp.accuracyLong3, fp.accuracyLong4, fp.accuracyLong5, fp.accur  \
				FROM FingerprintData fp, Attendance a WHERE fp.attendanceID = a.attendanceID and a.courseID=? and a.number<=?;"
	let arg = [course_id, class_number]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceStudentsLocation:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}


database.prototype.getStudentsLocation = function(course_id, shift_id, class_number, callback){
	let sql = "SELECT  fp.ist_id, fp.accuracyLat1, fp.accuracyLat2, fp.accuracyLat3, fp.accuracyLat4, fp.accuracyLat5, fp.accuracyLong1, fp.accuracyLong2, fp.accuracyLong3, fp.accuracyLong4, fp.accuracyLong5, fp.accur  \
				FROM FingerprintData fp, Attendance a WHERE fp.attendanceID = a.attendanceID and a.courseID=? and a.number=? and a.shift_id=?;"
	let arg = [course_id, class_number, shift_id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsLocation:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}


database.prototype.getClassIsRemote = function(classNumber, courseID, shift_id, callback) {
	let sql = "SELECT DISTINCT remote \
		FROM Attendance\
		WHERE number = ? and courseID = ? and shift_id = ?"
	let arg = [classNumber, courseID, shift_id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getClassIsRemote:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getClassIsRemoteByAttendanceID = function(attendaceID, callback) {
	let sql = "SELECT DISTINCT remote \
		FROM Attendance\
		WHERE attendanceID = ?"
	let arg = [attendaceID]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getClassIsRemoteByAttendanceID:", err);
			callback(err);
		} else {
			callback(err, rows[0]['remote']);
		}
	})
}

database.prototype.getStudentsFP = function(ist_id, shift_id, course_id, class_number, callback){
	let sql = " SELECT distinct fp.attendanceID, aid.confidence, fp.availableScreenResolution, fp.colorDepth, fp.deviceMemory, fp.fonts, fp.gpu, fp.hardwareConcurrency, fp.ip, fp.languages, fp.platform, fp.plugins, fp.screenResolution, fp.useragent FROM FingerprintData fp, Attendance a, AttendanceHistory aid WHERE fp.attendanceID=a.attendanceID and a.attendanceID=aid.attendanceID  and fp.attendanceID=aid.attendanceID and a.courseID = ? and fp.ist_id=? and aid.ist_id=?;"
	let arg = [course_id, ist_id, ist_id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsFP:", err);
			callback(err);
		} else {
			callback(err, rows);

		}
	})
}

database.prototype.getlastattendanceidforclass = function(shift_id, course_id, class_number, id, callback){
	let sql = " SELECT a.attendanceID from Attendance a, AttendanceHistory aid where aid.attendanceID=a.attendanceID and a.courseID = ? and a.shift_id = ? and a.number = ? and aid.ist_id=? "
	let arg = [course_id, shift_id, class_number, id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getlastattendanceidforclass:", err);
			callback(err);
		} else {
			if (rows.length > 1) {
				callback(err, rows[rows.length-1]);
			} else {
				callback(err, rows[0]);
			}

		}
	})
}

database.prototype.getlastattendanceidforclasswithoutID = function(shift_id, course_id, class_number, callback){
	let sql = " SELECT a.attendanceID from Attendance a where a.courseID = ? and a.shift_id = ? and a.number = ?; "
	let arg = [course_id, shift_id, parseInt(class_number)]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getlastattendanceidforclasswithoutID:", err);
			callback(err);
		} else {
			if (rows.length > 1) {
				callback(err, rows[rows.length-1].attendanceID);
			} else {
				callback(err, rows[0].attendanceID);
			}

		}
	})
}

database.prototype.getallindicatorconfidence = function(course_id, id, callback){
	let sql = " SELECT c.attendanceID, c.useragent, c.ip, c.languages, c.colorDepth, c.deviceMemory, c.hardwareConcurrency, c.screenResolution, c.availableScreenResolution, c.sessionStorage, c.localStorage, c.platform, c.plugins, c.fonts, c.audio, c.gpu \
		from FingerprintConfidence c, Attendance a where c.attendanceID=a.attendanceID and a.courseID = ? and c.ist_id=? "
	let arg = [course_id, id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getallindicatorconfidence:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getAttendanceByAttendanceAndClassNumber = function(attendanceNumber, classNumber, courseID, shiftID, callback){
	let sql = " SELECT attendanceID FROM Attendance WHERE number=? AND numberAttendance=? and courseID = ? and shift_id=?;"
	let arg = [classNumber, attendanceNumber, courseID, shiftID]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendanceByAttendanceAndClassNumber:", err);
			callback(err);
		} else {
			if (rows.length > 0){
				callback(err, rows[rows.length-1]['attendanceID']);
			} else {
				callback(err, null)
			}
		}
	})
}

database.prototype.getAttendancesByClassNumber = function(classNumber, courseID, shiftID, ist_id, callback){
	let sql = " SELECT distinct ah.attendanceID FROM AttendanceHistory ah, Attendance a WHERE a.attendanceID=ah.attendanceID and a.number=? and a.courseID = ? and a.shift_id = ? and ah.ist_id=?;"
	let arg = [classNumber, courseID, shiftID, ist_id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getAttendancesByClassNumber:", err);
			callback(err);
		} else {
			if (rows.length > 0){
				callback(err, rows);
			} else {
				callback(err, null)
			}
		}
	})
}


database.prototype.insertIntoAttendanceHistory = function(my_attendanceID, my_ist_id, callback){
	let sql = " INSERT IGNORE INTO AttendanceHistory(attendanceID, ist_id, success, manually) VALUES (?, ?, true, false);"
	let arg = [my_attendanceID, my_ist_id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in insertIntoAttendanceHistory:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getEnrolledClasses = function(callback){
	let sql = " select distinct ah.ist_id, c.courseID, c.courseName, c.academicTerm, (select count(DISTINCT ah1.attendanceID) from AttendanceHistory ah1, Attendance a1 where ah1.attendanceID=a1.attendanceID and a1.courseID=a.courseID and ah.ist_id=ah1.ist_id) as attended from AttendanceHistory ah, Attendance a, Course c where ah.attendanceID=a.attendanceID and a.courseID=c.courseID;"
	let arg = []

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getEnrolledClasses:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getTeachingClasses = function(callback){
	let sql = " select distinct p.ist_id, c.courseID, c.courseName, c.academicTerm from ProfessorTeachesCourse p, Course c where c.courseID=p.courseID; "
	let arg = []

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getTeachingClasses:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getStudentsName = function(callback) {
	let sql = " select distinct ist_id, name from User; "
	let arg = []

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentsName:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getStudentNameByID = function(ist_id, callback) {
	let sql = "select distinct name from User where ist_id=?; "
	let arg = [ist_id]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getStudentNameByID:", err);
			callback(err);
		} else {
			callback(err, rows);
		}
	})
}

database.prototype.getCourseIDByClassSecret = function(secret, callback) {
	let sql = "SELECT courseID from Attendance where secret=?;"
	let arg = [secret]

	this.pool.query(sql, arg, function(err, rows, fields) {
		if(err) {
			console.log("Error in getCourseIDByCourseSecret:", err);
			callback(err);
		} else {
			callback(err, rows[0]['courseID']);
		}
	})
}

database.prototype.updateStatusForStudent = function(attendanceID, ist_id, state){
	let sql = "UPDATE AttendanceHistory SET late=? WHERE ist_id=? and attendanceID=?"
	let arg = [state, ist_id, attendanceID]

	this.pool.query(sql, arg, function(err, rows, fields) {
		//callback(err)
	})
}

database.prototype.getClassByShiftID = function(courseID, shiftID, callback){
	let sql = "SELECT distinct number from Attendance where courseID=? and shift_id=?"
	let arg = [courseID, shiftID]

	this.pool.query(sql, arg, function (err, rows, fields) {
		if (err){
			console.log("Error getting class information by shiftID.", err);
			callback(err);
		}
		else {
			callback(err, rows);
		}
	});
}

module.exports = database;
