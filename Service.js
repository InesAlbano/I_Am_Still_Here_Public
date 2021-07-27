var fenix_api = require('./fenix_api');
var FpUpdater = require('./FingerprintUpdater');

var Service = function() {};
var Code = require('./Code');
var CSV_SEPARATOR = "\t";

var codeByRandomID = new Map();		// randomID --> code;

const fixedFingerprintWeight = {
	useragent: 4,
	ip : 6,
	languages : 2,
	colorDepth : 8,
	deviceMemory : 6,
	hardwareConcurrency : 6,
	screenResolution : 6,
	availableScreenResolution : 8,
	timezoneOffset : 2,
	sessionStorage : 2,
	localStorage : 2,
	platform : 6,
	plugins : 6,
	canvas : 0,
	pixelDepth : 0,
	adBlock : 2,
	fonts : 6,
	audio : 8,
	gpu : 8,
}

Service.prototype.verifyRandomID = function(db, randomID, ist_id, useragent, ip, callback) {
	let code = codeByRandomID.get(randomID);
	if(!code) {
		callback(null, false);
		return;
	}
	let attendanceID = code.getAttendanceID();
	let canAccess = code.canStudentAccess(ist_id);
	let that = this;
	this.studentAttendanceChecked(db, ist_id, randomID,
		function(error, isChecked) {
			if(isChecked) {
				callback(null, true, true);
			} else {
				that.insertFingerprintData(db, ist_id, useragent, ip, attendanceID,
					function(error){
						callback(error, code != undefined, false, canAccess);
					}
				);
			}
		}
	);
}

Service.prototype.getAttendanceTypeByRandomID = function(randomID) {
	var code = codeByRandomID.get(randomID);
	if(!code) {
		return "";
	}
	return code.getCodeType();
}

Service.prototype.validateCode = async function (db, res, randomID, client_code, ist_id, callback) {
	let code = codeByRandomID.get(randomID);
	if (code) {
		if (!code.canStudentAccess(ist_id)) {
			callback("You are not enrolled");
			return;
		}

		await code.clientInput(client_code, ist_id);
		let json = {};
		let codeStatus = code.getCodeStatus(ist_id);
		json.isAttFinished = (codeStatus === 'Finished' ? 1 : 0);
		json.isCodeCorrect = (codeStatus === 'Correct' ? 1 : 0);
		json.isSame = (codeStatus === 'Same' ? 1 : 0);
		json.consecutive_codes_total = code.getConsecutiveCodes();
		json.consecutive_correct = code.getSequenceForStudent(ist_id);
		if (json.isAttFinished){
			code.insertStudentIntoAttendance(ist_id, function(err, rows){
				if (err) callback(err)
				else{
					code.insertStudent(ist_id);
				}
			})
		}

		callback(null, json)
	} else {
		callback("Error in validateCode.", "unknown randomID");
	}
}


Service.prototype.verifyAttendance = function(db, ist_id, attendanceID, consecutive_codes, callback) {
	db.verifyAttendance(ist_id, attendanceID, consecutive_codes,
		function(error, consecutive_codes) {
			if(error) {
				callback(error);
			} else {
				callback(consecutive_codes);
			}
		}
	);
}

Service.prototype.getShiftsByCourseID = function(db, courseID, callback) {
	db.getShiftsByCourseID(courseID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getShiftsInfo = function(db, shiftid, callback) {
	db.getShiftsInfo(shiftid,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}


Service.prototype.createandinsertstudents = function(db, courseID, ist_id, is_extra, title, number, text, shift, callback) {
	db.generateRandomAttendanceCode(ist_id, 0, null, null, null, null, courseID, is_extra, title, number, shift,
		function(error, attendanceID) {
			if(error) {
				callback(error);
			} else {
				let split_text = text.split('\n');
				let line = 0;
				aux_manuallyInsertStudent(db, attendanceID, line, split_text, callback);
			}
		}
	);
}

function aux_manuallyInsertStudent(db, attendanceID, line, split_text, callback) {
	if(line < split_text.length) {
		let split_line = split_text[line].split(',');
		let split_line_1 = split_line[1].trim();
		if(split_line_1 == "late") {
			db.manuallyInsertLateStudent(split_line[0], attendanceID,
				function(error) {
					line++;
					if(line < split_text.length) {
						aux_manuallyInsertStudent(db, attendanceID, line, split_text, callback);
					} else {
						callback(error);
					}
				});
		} else if(split_line_1 == "ok") {
			db.manuallyInsertStudent(split_line[0], attendanceID,
				function(error1) {
					line++;
					if(line < split_text.length) {
						aux_manuallyInsertStudent(db, attendanceID, line, split_text, callback);
					} else {
						callback(error1);
					}
				}
			);
		} else {
			console.log("Error in aux_manuallyInsertStudent.");
			callback(error);
		}
	}
}



Service.prototype.updateStudentNameAndNumber = function(db, text, courseID, callback) {
	let split_text = text.split('\n');
	let line = 0;
	aux_updateStudentNameAndNumber(db, line, split_text, courseID, callback);
}

function aux_updateStudentNameAndNumber(db, line, split_text, courseID, callback) {
	if(line < split_text.length) {
		let split_line = split_text[line].split(',');
		db.updateStudentNameAndNumber(split_line[2], split_line[1], split_line[0], courseID,
			function(error) {
				line++;
				if(line < split_text.length) {
					aux_updateStudentNameAndNumber(db, line, split_text, courseID, callback);
				} else {
					callback(error);
				}
			}
		);
	}
}


Service.prototype.insertFingerprintData = function(db, ist_id, useragent, ip, attendanceID, callback) {
	db.insertFingerprintData(ist_id, useragent, ip, attendanceID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.getAllAcademicTerms = function(db, ist_id, callback) {
	db.getAllAcademicTerms(ist_id,
		function(error, result) {
			callback(error, result);
		}
	);
}

Service.prototype.getExistingAcademicTerms = function(db, callback) {
	db.getExistingAcademicTerms(
		function(error, result) {
			callback(error, result);
		}
	);
}

Service.prototype.getExistingCourses = function(db, callback) {
	db.getExistingCourses(
		function(error, result) {
			callback(error, result);
		}
	);
}

Service.prototype.deserializedAttendancesFromLastDay = function(db, callback) {
	db.deserializedAttendancesFromLastDay(
		function(error, rows) {
			db.getAttendanceSequence(
				function(error1, rows1) {
					if(error || error1) {
						callback(error);
						return;
					}
					var attendances = [];
					aux_deserializedAttendancesFromLastDay(db, 0, rows, rows1, attendances,
						function() {
							callback(error, attendances);
						}
					);
				}
			);
		}
	);
}

function aux_deserializedAttendancesFromLastDay (db, i, rows, rows1, attendances, callback) {
	if(i >= rows.length) {
		callback();
		return;
	}
	let at = rows[i];
	db.getStudentsByCourseID(at.courseID,
		function(error2, studentsEnrolled) {
			let list = [];
			for(let q = 0; q < studentsEnrolled.length; q++) {
				list.push(studentsEnrolled[q].ist_id);
			}

			if(error2) {
				callback(error2);
			} else if((at.code_length && at.code_type && at.total_time_s && at.consecutive_codes)) {
				attendances.push(at.attendanceID);
				var code = new Code(db, at.randomID, at.attendanceID);
				for(let k of rows1) {
					if(k.attendanceID == at.attendanceID) {
						code.code_counter = k.sequence;
						break;
					}
				}

				code.customizeTest(at.code_length, at.code_type, at.total_time_s, at.consecutive_codes, at.requiresAccess, list);
				codeByRandomID.set(at.randomID, code);

				if(at.open == 1) {
					code.startProcess();
				}
			}
			aux_deserializedAttendancesFromLastDay(db, i+1, rows, rows1, attendances, callback);
		}
	);
}

Service.prototype.manuallyInsertStudent = function(db, ist_id, attendanceID, callback) {
	db.manuallyInsertStudent(ist_id, attendanceID,
		function(error) {
			if (error) callback(error)
			else {
				db.getConfidenceLevel(ist_id, attendanceID, function(error1, confidence){
					if (error1) callback(error1)
					else {
						db.copyConfidenceCodeToConfidenceAttendance(ist_id, attendanceID, confidence,
							function(error2) {
								callback(error2)
							}
						);
					}
				})


			}

		}
	);
}

Service.prototype.getAttendanceByAttendanceAndClassNumber = function(db, attendanceNumber, classNumber, courseID, shiftID, callback){
	db.getAttendanceByAttendanceAndClassNumber(attendanceNumber, classNumber, courseID, shiftID,
		function (error, attendanceID) {
			callback(error, attendanceID);
		})
}

Service.prototype.manuallyInsertLateStudent = function(db, ist_id, attendanceID, callback) {
	db.manuallyInsertLateStudent(ist_id, attendanceID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.manuallyRemoveStudent = function(db, ist_id, attendanceID, callback) {
	db.manuallyRemoveStudent(ist_id, attendanceID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.getAttendancesByClassNumber = function(db, classNumber, courseID, shiftID, ist_id, callback) {
	db.getAttendancesByClassNumber(classNumber, courseID, shiftID, ist_id,
		function(error, rows) {
			callback(error, rows)
		}
	);
}

Service.prototype.manuallyRemoveAttendance = function(db, classNumber, courseID, shiftID, callback) {
	db.manuallyRemoveAttendance(classNumber, courseID, shiftID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.manuallyUpdateAttendance = function(db, classNumber, courseID, shiftID, new_number, new_title, callback) {
	db.manuallyUpdateAttendance(classNumber, courseID, shiftID, new_number, new_title,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.manuallyRemoveShift = function(db, shiftID, callback) {
	db.manuallyRemoveShift(shiftID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.manuallyRemoveCourse = function(db, courseID, callback) {
	db.RemovingProfessorTeachesCourse(courseID,
		function(e1) {
			if (e1) callback(e1);
			else {
				db.RemovingStudentsEnrolled(courseID,
					function(e2) {
						if (e2) callback(e2);
						else {
							db.RemovingClass(courseID,
								function(e3) {
									if (e3) callback(e3);
									else {
										db.RemovingShiftByCourseID(courseID,
											function(e4) {
												if (e4) callback(e4);
												else {
													db.RemovingAttendanceByCourseID(courseID,
														function(e5) {
															if (e5) callback(e5);
															else {
																db.RemovingStudentStatusByCourseID(courseID,
																	function(e6) {
																		if (e6) callback(e6);
																		else {
																			db.RemovingIndicatorFixedWeightByCourseID(courseID,
																				function(e7) {
																					if (e7) callback(e7);
																					else {
																						db.manuallyRemoveCourse(courseID,
																							function(error) {
																								callback(error);
																							}
																						);
																					}
																				}
																			);
																		}
																	}
																);
															}
														}
													);
												}
											}
										);
									}
								}
							);
						}
					}
				);
			}
		}
	);
}



Service.prototype.manuallyremoveacademicterm = function(db, academicterm, callback) {
	db.manuallyremoveacademicterm(academicterm,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.updateAdmin = function(db, ist_id, operation, callback) {
	db.updateAdmin(ist_id, operation,
		function(error) {
			if (!error)
				if (operation === 'add')
					db.updateProfessor(ist_id, operation, function(err){
						callback(err)
					});
				else callback(error);
			else callback(error);
		}
	);

}

Service.prototype.removeProfessorFromCourse = function(db, ist_id, courseID, callback) {
	db.removeProfessorFromCourse(ist_id, courseID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.getProfessorsByCourse = function(db, courseID, ist_id, callback) {
	db.getProfessorsByCourse(courseID,
		function(error, rows) {
			var result = {ist_id: ist_id, rows: rows};
			if(error) {
				callback(error);
			} else {
				callback(error, result);
			}
		}
	);
}

Service.prototype.getStudentsByCourse = function(db, courseID, callback) {
	db.getStudentsByCourse(courseID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getShiftsByCourse = function(db, courseID, callback) {
	db.getShiftsByCourse(courseID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getClassByShiftID = function(db, courseID, shiftID, callback) {
	db.getClassByShiftID(courseID,shiftID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getAttedancesbyClassNumber = function(db, courseNumber, courseID, shiftID, callback) {
	db.getAttedancesbyClassNumber(courseNumber, courseID, shiftID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getFingerprintData = function(db, ist_id, attendanceID, callback) {
	db.getFingerprintData(ist_id, attendanceID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getFingerprintDataTable = function(db, attendanceID, callback) {
	db.getFingerprintDataTable(attendanceID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				let result = [];
				// for each ist_id
				for(let k = 0; k < rows.length; k++) {
					let ist_id = rows[k].ist_id;
					let ip = rows[k].ip;

					// for each ip
					for(let j = 0; j < rows.length; j++) {
						let next_ip = rows[j].ip;
						let next_istid = rows[j].ist_id;
						if(next_ip == ip && next_istid != ist_id) {
							if(!result.includes(next_istid)){
								result.push(next_istid);
							}
						}
					}
				}
				callback(error, result);
			}
		}
	);
}

Service.prototype.getManuallyInsertedStudents = function(db, attendanceID, callback) {
	db.getManuallyInsertedStudents(attendanceID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getLateStudents = function(db, attendanceID, callback) {
	db.getLateStudents(attendanceID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.isProfessor = function(db, ist_id, callback) {
	db.isProfessor(ist_id,
		function(error, is_professor) {
			if(error) {
				callback(error);
			} else {
				callback(error, is_professor);
			}
		}
	);
}

Service.prototype.getAttendanceByRandomID = function(db, ist_id, randomID, callback) {
	db.getAttendanceByRandomID(randomID, ist_id,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getAttendanceByRandomCode = function(db, randomID, callback) {
	db.getAttendanceByRandomCode(randomID,
		function(error, rows) {
			if(error) {
				callback(error);
			} else {
				callback(error, rows);
			}
		}
	);
}

Service.prototype.getStatus = function(db, ist_id, randomID, callback) {
	this.getCode(db, ist_id, randomID,
		function(error, code) {
			if(error) {
				callback(error);
			} else {
				callback(code.status());
			}
		}
	);
}

Service.prototype.getCode = function(db, ist_id, randomID, callback) {
	var code = codeByRandomID.get(randomID);
	if(code){
		callback(null, code);
	} else {
		db.getAttendanceByRandomID(randomID, ist_id,
			function(error, rows) {
				if(error) {
					callback(error);
				} else {
					if(rows[0]){
						var code = new Code(db, randomID, rows[0].attendanceID);
						code.customizeTest(rows[0].code_length, rows[0].code_type, rows[0].total_time_s, rows[0].consecutive_codes, rows[0].requiresAccess);
						codeByRandomID.set(randomID, code);
						code.startProcess();
						callback(null, code);
					} else {
						console.log("Error in getCode");
						callback(error);
					}
				}
			}
		);
	}
}


Service.prototype.generateCode = function(ist_id, randomID, callback) {
	var code = codeByRandomID.get(randomID);
	if(code){
		callback(code.newCode());
	} else {
		callback("Error in generateCode.");
	}
}

Service.prototype.stopProcess = function(ist_id, randomID, callback) {
	var code = codeByRandomID.get(randomID);
	if(code){
		callback(code.stopProcess());
	} else {
		callback("Error in stopProcess.");
	}
}

Service.prototype.getAccessToken = function(db, res, fenix_code, callback) {
	var that = this;
	fenix_api.requestAccessToken(fenix_code,
		function(error, access_token, refresh_token) {
			fenix_api.getUserInfo(access_token, refresh_token,
				function(error, info, isProfessor) {
					if(error) {
						callback("getAccessToken error",error);
					} else {
						db.insertUser(info.username, access_token, refresh_token, info.name,
							function(error, iamhere_token){
								if(isProfessor) {
									fenix_api.getCourseInfo(access_token, refresh_token,
										function(error, body) {
											var info_teaching = body["teaching"];
											for(let k = 0; k < info_teaching.length; k++) {
												db.insertProfessorandCourse(info.username, info_teaching[k]["acronym"], info_teaching[k]["name"], info_teaching[k]["academicTerm"], info_teaching[k]["id"],
													function(error) {
														callback(iamhere_token);
													}
												);
											}
										}
									)
								} else {
									const fp = [
										"useragent",
										"ip",
										"languages",
										"colorDepth",
										"deviceMemory",
										"hardwareConcurrency",
										"screenResolution",
										"availableScreenResolution",
										"timezoneOffset",
										"sessionStorage",
										"localStorage",
										"platform",
										"plugins",
										"canvas",
										"pixelDepth",
										"adBlock",
										"fonts",
										"audio",
										"gpu"]

									fp.forEach(function(f) {
										db.insertOrUpdateFingerprintHistory(info.username, f, '', 0)
									})

									callback(iamhere_token);
								}
							}
						);
					}
				}
			);
		}
	);
};

Service.prototype.getFenixIDByCourseID = function(db, courseID, callback) {
	db.getFenixIDByCourseID(courseID,
		function(error, fenix_id) {
			if(error) {
				callback(error);
			} else {
				callback(error, fenix_id);
			}
		}
	);
}

function checkCourseShiftInfo(info, moreFields = []){
	let fields = moreFields.concat(["campus", "code_length", "code_type", "consecutivecodes", "week_day", "end", "professor_id", "room", "shift_id", "start", "time", "type"]);
	for(f of fields){
		if ((!info[f]) || info[f] === ""){
			console.log("Invalid field:", f, info[f]);
			return false;
		}
	}
	return true;
}

function checkCourseShiftInfoToUpdate(info){
	return checkCourseShiftInfo(info, ["shift_uid"]);
}

function aux_updateShifts(db, i, courseID, toUpdate, updateResults, callback){
	if(i >= toUpdate.length){
		callback();
		return;
	}

	let row = toUpdate[i];
	db.updateCourseShiftInfo(row.shift_id, row.type, row.week_day, row.start, row.end, row.campus, row.room, courseID,
		row.professor_id, row.code_type, row.code_length, row.consecutivecodes, row.time, row.shift_uid,
		function(error) {
			updateResults[i] = error ? "error" : "ok";
			return aux_updateShifts(db, i+1, courseID, toUpdate, updateResults, callback);
		}
	);
}

Service.prototype.insertShift = function(db, info, callback) {
	db.addCourseShiftInfo('', info.shift_id, info.type, info.week_day, info.start, info.end, info.campus, info.room, info.courseID, info.professor_id, info.code_type, info.code_length, info.consecutivecodes, info.time,
		function(err){
			callback(err);
	})
}

Service.prototype.updateShift = function(db, info, callback) {
	db.updateCourseShiftInfo(info.shift_id, info.type, info.week_day, info.start, info.end, info.campus, info.room, info.courseID, info.professor_id, info.code_type, info.code_length, info.consecutivecodes, info.time,
		function(err){
			callback(err);
		})
}


Service.prototype.updateCourse = function(db, info, callback) {
	db.updateCourse(info.courseID, info.courseName, info.academicTerm, info.code_type, info.code_length, info.consecutivecodes, info.time,
		function(err){
			if (!err){
				db.getShiftsByCourseID(info.courseID,
					function(err1, rows){
						if (rows.length > 0) {
							db.updateCourseShiftInfoCodes(info.courseID, info.code_type, info.code_length, info.consecutivecodes, info.time,
								function (err2) {
									callback(err2)
								})
						}
					})
			} else {
				callback(err);
			}
		})
}


Service.prototype.insertCourseShiftInfo = function(db, courseID, callback) {
	db.getFenixIDByCourseID(courseID,
		function(error, fenix_id) {
			if(error) {
				callback(error);
			} else {
				fenix_api.requestCourseShift(fenix_id,
					function(error, body) {
						let shifts = body["shifts"];
						auxShifts_insertCourseShiftInfo(db, shifts, 0, courseID, fenix_id, callback);
					});
			}
		}
	);
}

function auxShifts_insertCourseShiftInfo(db, shifts, si, courseID, fenix_id, callback) {
	if(si < shifts.length) {
		let s = shifts[si];
		let shift_id = s["name"];
		let type = s["types"][0];

		if (type === 'TEORICA') type = 'Teórica'
		else if (type === 'LABORATORIAL') type = 'Laboratorial'
		else if (type === 'PRATICA') type = 'Prática'
		else if (type === 'SEMINARIO') type = 'Seminário'

		auxLessons_insertCourseShiftInfo(db, s["lessons"], 0, courseID, fenix_id, shift_id, type,
			function(error) {
				if(error) {
					console.log("Error in auxShifts_insertCourseShiftInfo");
					callback(error);
				} else {
					auxShifts_insertCourseShiftInfo(db, shifts, si+1, courseID, fenix_id, callback);
				}
			}
		);
	} else {
		callback(undefined);
	}
}

function auxLessons_insertCourseShiftInfo(db, lessons, li, courseID, fenix_id, shift_id, type, callback) {
	if(li < lessons.length) {
		let l = lessons[li];
		let start = new Date(l["start"]);
		let end = l["end"].split(" ")[1];
		let week_day = start.getDay();
		start = l["start"].split(" ")[1];
		let room = (l["room"] ? l["room"]["name"] : '');
		let campus = (l["room"] ? l["room"]["topLevelSpace"]["name"] : '');

		db.insertCourseShiftInfo(fenix_id, shift_id, type, week_day, start, end, campus, room, courseID,
			function(error) {
				if(error) {
					console.log("Error in insertCourseShiftInfo (Service).");
					callback(error);
				} else {
					auxLessons_insertCourseShiftInfo(db, lessons, li+1, courseID, fenix_id, shift_id, type, callback);
				}
			}
		);
	} else {
		callback(undefined);
	}

}

Service.prototype.studentAttendanceChecked = function(db, ist_id, randomID, callback) {
	db.studentAttendanceChecked(ist_id, randomID, function(err, isChecked) {
		if(err) {
			callback(err);
		} else {
			callback(err, isChecked);
		}
	});
};

Service.prototype.selectCourseInfo = function(db, ist_id, academicTerm, callback) {
	db.selectCourseInfo(ist_id, academicTerm,
		function(err, rows) {
			if(err) {
				callback(err);
			} else {
				callback(err, rows);
			}
	});
};

Service.prototype.getAttendanceHistory = function(db, ist_id, courseID, shift, callback) {

	db.getAttendanceHistory(ist_id, courseID, shift, function(err, res) {
		if(err) {
			callback(err);
		} else {
			db.getCourseName(courseID, function(err1, res1) {
				if(err1) {
					callback(err1);
				} else {
					db.getNumStudentsForClass(courseID, shift, function(err2, res2){
						if(err2)
							callback(err2)
						else {
							if(res2.length > 0){
								for (let i = 0; i < res['rows'].length; ++i){
									for (let j = 0; j < res2.length; ++j){
										if (res['rows'][i]['number'] === res2[j]['number']) {
											res['rows'][i]['count'] = res2[j]['count']
										}
									}
								}
							}
							let json = {
								history: res,
								courseName: res1.courseName,
								secret: res1.secret
							};
							callback(err2, json);
						}
					});
				}
			});
		}
	});
};

Service.prototype.getClassHistory = function(db, classID, attendanceID, courseID, shiftID, callback) {
	let thisService = this;
	db.getClassHistory(classID, courseID, shiftID, function(err, rows) {
		if(err) {
			callback(err);
		} else {
			db.getStudentsThatTried(attendanceID, courseID, shiftID, classID,
				function(error2, rows_studentsThatTried) {
					if(error2) {
						callback(error2);
					} else {
						let o = {
							rows: rows,
							rows_studentsThatTried: rows_studentsThatTried
						};
						callback(null, o);
					}
				}
			)
		}
	});
};

Service.prototype.getCourseInfo = function(db, res, fenix_code, access_token, refresh_token, callback) {
	fenix_api.getCourseInfo(access_token, refresh_token,
		function(error, info) {
			var info_teaching = info["teaching"];
			if(!info_teaching || !info_teaching.length || info_teaching.length == 0) {
				callback(error);
			} else {
				for(let k = 0; k < info_teaching.length; k++) {
					db.insertCourse(info_teaching[k]["acronym"], info_teaching[k]["name"], info_teaching[k]["academicTerm"],
						function(error) {
						}
					);
				}
			callback(info_teaching);
			}
		}
	);
}

Service.prototype.verifyLogin = function(db, iamhere_token, callback) {
	db.getUserByToken(iamhere_token,
		function(error, ist_id) {
			callback(ist_id);
		}
	);
}

Service.prototype.getUserName = function(db, ist_id, callback) {
	db.getUserName(ist_id,
		function(error, name) {
			callback(name);
		}
	);
}

Service.prototype.getisAdmin = function(db, ist_id, callback) {
	db.getisAdmin(ist_id,
		function(error, name) {
			callback(name);
		}
	);
}


Service.prototype.getAttendanceRandomID = function(db, ist_id, code_type, code_length, total_time_s, consecutive_codes, courseID, is_extra, title, number, shift, attendance_checks, attendance_number, remote, requiresAccess, studentsEnrolled, callback) {
	var randomID;
	do {
		randomID = Math.floor(Math.random() * Math.floor(999999));
	} while(codeByRandomID.has(randomID));
	codeByRandomID.set(randomID, null);

	db.generateRandomAttendanceCode(ist_id, randomID, code_type, code_length, total_time_s, consecutive_codes, courseID, is_extra, title, number, shift, requiresAccess, attendance_checks, attendance_number, remote,
		function(error, attendanceID) {
			var new_code = new Code(db, randomID, attendanceID);
			new_code.customizeTest(code_length, code_type, total_time_s, consecutive_codes, requiresAccess, studentsEnrolled);
			codeByRandomID.set(randomID, new_code);
			callback(error, randomID, attendanceID);
		}
	);
}

Service.prototype.closeAttendance = function(db, randomID, callback) {
	let code = codeByRandomID.get(randomID);

	code.insertStudentsThatDidNotFinish(function(err, code){
		if (err) callback(err)
		else {
			db.closeAttendance(randomID,
				function(error, success) {
					codeByRandomID.set(randomID, null);
					callback(error, success);
				}
			);
		}
	})
}


Service.prototype.removeIAmHereToken = function(db, ist_id, callback) {
	db.removeIAmHereToken(ist_id,
		function(error, success) {
			callback(error, success);
		}
	);
}

Service.prototype.getAttendances = function(db, callback) {
	db.getAttendances(function(error, rows) {
			let result = appendToFile(rows);
			callback(error, result);
		}
	);
}

Service.prototype.getStudentAttendanceHistory = function(db, ist_id, callback) {
	db.getStudentAttendanceHistory(ist_id,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getPCM2021AttendanceFlow = function(db, callback) {
	db.getPCM2021AttendanceFlow(
		function(error, rows) {
			callback(error, rows);
		}
	);
}


Service.prototype.getAllUsers = function(db, callback) {
	db.getAllUsers(
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getAllFingerprintData = function(db, classN, shiftID, courseID, ist_id, callback){
	db.getlastattendanceidforclasswithoutID(shiftID, courseID,classN, function(err1, attendanceID){
		db.getAllFingerprintData(attendanceID, courseID, ist_id,
			function(err, rows){
				callback(err, rows)
			});
	})

}

Service.prototype.getEnrolledClasses = function(db, callback) {
	db.getEnrolledClasses(
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getTeachingClasses = function(db, callback) {
	db.getTeachingClasses(
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getAttendanceFlow = function(db, courseID, callback) {
	db.getAttendanceFlow(courseID,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getAttendedClasses = function(db, courseID, ist_id, callback) {
	db.getAttendedClasses(courseID, ist_id,
		function(error, rows) {
			callback(error, rows);
		}
	);
}


Service.prototype.getMaxNclass = function(db, courseID, callback) {
	db.getMaxNclass(courseID,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getInactiveCourses = function(db, ist_id, callback) {
	db.getInactiveCourses(ist_id,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getAttendancesByCourseSecret = function(db, secret, callback) {
	db.getAttendancesByCourseSecret(secret, function(error, rows) {
			let result = appendToFile_general(rows);
			callback(error, result);
		}
	);
}

Service.prototype.getAttendancesByShiftSecret = function(db, secret, callback) {
	db.getAttendancesByShiftSecret(secret, function(error, rows) {
			let result = appendToFile_general(rows);
			callback(error, result);
		}
	);
}

Service.prototype.getAttendancesByClassSecret = function(db, secret, callback) {
	db.getAttendancesByClassSecret(secret, function(error, rows) {
			let result = appendToFile_general(rows);
			callback(error, result);
		}
	);
}

Service.prototype.getAttendancesByCourseProfessorClass = function(db, courseID, ist_id, attendanceID, shift, callback) {
	db.getAttendancesByCourseProfessorClass(courseID, ist_id, attendanceID, shift, function(error, rows) {
			let result = appendToFile_general(rows);
			callback(error, result);
		}
	);
}

Service.prototype.setLate = function(db, attendanceID, ist_id, isLate, callback) {
	db.setLate(attendanceID, ist_id, isLate,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.setCourseToInUse = function(db, ist_id, courseID, callback) {
	db.setCourseToInUse(ist_id, courseID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.insertManuallyProfessor = function(db, ist_id, courseID, callback) {
	db.insertManuallyProfessor(ist_id, courseID,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.insertacademicterm = function(db, academicterm, callback) {
	db.insertacademicterm(academicterm,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.updateStudentStatus = function(db, totalConfirm, specificConfirm, specificLate, specificEarly, courseID, shiftID, classNumber, callback) {
	db.updateStudentStatus(totalConfirm, (specificConfirm ? specificConfirm.toString(): null), (specificLate ? specificLate.toString() : null), (specificEarly ? specificEarly.toString() : null), courseID, shiftID, classNumber,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.updateFixedThresh = function(db, courseID, shiftID, classNumber, type, failed, ok, callback) {
	db.getFixedThresh(courseID, shiftID, classNumber,
		function(err, rows){
			if (err) callback(err)
			else {
				if (rows.length > 0) {
					db.updateFixedThresh(courseID, shiftID, classNumber, type, failed, ok,
						function(error) {
							callback(error);
						}
					);
				} else {
					db.updateFixedThresh(courseID, shiftID, classNumber, 'insert', 81, 90,
						function(error1) {
							if (error1) callback(error1)
							else
								db.updateFixedThresh(courseID, shiftID, classNumber, type, failed, ok,
									function(error2) {
										callback(error2);
									}
								);
						}
					);
				}
			}
		})


}

Service.prototype.updateFixedWeight = function(db, courseID, shiftID, classNumber, indicator, future, callback) {
	db.updateFixedWeight(courseID, shiftID, classNumber, indicator.useragent, indicator.ip, indicator.languages, indicator.colorDepth, indicator.deviceMemory, indicator.hardwareConcurrency, indicator.screenResolution, indicator.availableScreenResolution, indicator.sessionStorage, indicator.localStorage, indicator.platform, indicator.plugins, indicator.fonts, indicator.audio, indicator.gpu, indicator.adBlock, indicator.pixelDepth, future,
		function(error) {
			callback(error);
		}
	);
}


Service.prototype.updateFutureFixedWeightForCourse = function(db, courseID, shiftID, classNumber, callback){
	db.updateFutureFixedWeightForCourse(courseID, shiftID, classNumber,
		function(err){
			callback(err);
		})
}

Service.prototype.updateConfidenceWeight = function(db, courseID, shiftID, classNumber, data, future, callback) {
	db.updateConfidenceWeight(courseID, shiftID, classNumber, 100-data.fp_gps_percent, data.fp_gps_percent, future,
		function(error) {
			callback(error);
		}
	);
}

Service.prototype.getConfidenceWeight = function(db, courseID, shiftID, classNumber, callback) {
	db.getConfidenceWeight(courseID, shiftID, classNumber,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.insertProfessorandCourse = function(db, ist_id, courseID, courseName, academicTerm, fenix_id, callback) {
	db.insertProfessorandCourse(ist_id, courseID, courseName, academicTerm, fenix_id,
		function(error, result) {
			if(error) {
				console.log("Error in insertProfessorandCourse:", error);
			} else {
				db.setCourseToInUse(ist_id, courseID,
					function(error1, result1) {
						callback(error1);
					}
				);
			}
		}
	);
}

function appendToFile_general(rows) {
	let ontime = "attended lecture";
	let res = "";
	if(rows == undefined) {
		return res;
	}
	for(i = 0; i < rows.length; i ++) {
		let line = rows[i].ist_id + CSV_SEPARATOR +
					(rows[i].fenix_number || "-") + CSV_SEPARATOR +
					rows[i].std_number + CSV_SEPARATOR +
					(rows[i].short_name ? rows[i].short_name : rows[i].name) + CSV_SEPARATOR +
					ontime;
		if(rows[i].late == 1) {
			line += " (late)";
		}
		if(rows[i].manually == 1) {
			line += CSV_SEPARATOR + "M" + CSV_SEPARATOR;
		} else {
			line += CSV_SEPARATOR + CSV_SEPARATOR;
		}
		if(typeof rows[i].number == "number") {
			line += rows[i].number + CSV_SEPARATOR;;
		} else {
			line += "-" + CSV_SEPARATOR;;
		}

		line += rows[i].shift_id + "\n";
		res += line;
	}
	return res;

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
		stream.write("prof" + CSV_SEPARATOR +
			"student_nr" + CSV_SEPARATOR +
			"student_name" + CSV_SEPARATOR +
			"attended" + CSV_SEPARATOR +
			"type" + CSV_SEPARATOR +
			"class" + "\n"
		);
	}
	return stream;
}

function appendToFile(rows) {
	let ontime = "attended lecture";
	let res = "";
	if(rows == undefined) {
		return res;
	}

	for(i = 0; i < rows.length; i ++) {
		let line = rows[i].ist_id + CSV_SEPARATOR +
					rows[i].std_number + CSV_SEPARATOR +
					rows[i].name + CSV_SEPARATOR +
					ontime;
		if(rows[i].late == 1) {
			line += " (late)";
		}
		if(rows[i].manually == 1) {
			line += CSV_SEPARATOR + "M" + CSV_SEPARATOR;
		} else {
			line += CSV_SEPARATOR + CSV_SEPARATOR;
		}

		if(rows[i].is_extra == 1) {
			line += rows[i].title + "\n";
		} else {
			line += rows[i].number + "\n";
		}
		res += line;
	}
	return res;

}

Service.prototype.getNextClassNumber = function(db, courseID, shift_id, callback) {
	db.getNextClassNumber(courseID, shift_id,
		function(error, rows) {
			if (error) callback(error)
			else {
				//JSON.parse(JSON.stringify(rows))
				if(rows['max(number)'] === null) {
					rows['max(number)'] = 0
				}
				db.getTitleForMaxClass(courseID, shift_id, rows['max(number)'],
					function(err, rows1) {
						if (err) callback(err)
						else {
							if (rows1 && rows1['title']) {
								rows['title'] = rows1['title']
							}
							if (rows1 && rows1['is_extra']){
								rows['extra'] = rows1['is_extra']

							}
							callback(error, rows);
						}
					}
				);

			}
		}
	);
}

Service.prototype.updateFingerprintData = function(db, randomID, j, ist_id, attendance_id, callback) {
	let array = ["languages", "colorDepth", "deviceMemory", "hardwareConcurrency", "screenResolution", "availableScreenResolution", "timezoneOffset", "sessionStorage", "localStorage", "platform", "plugins", "canvas", "pixelDepth","adBlock", "fonts", "audio","gpu", "coordinates", 'useragent','ip'];
	let result = {};
	let previous = {};
	let flags = [];
	let coord;
	if (j && j.my_data) {
		let j_data = j.my_data;

		db.getFingerprintHistory(ist_id, function(err, rows) {
				rows.forEach(function (r) {
					previous[r['indicator_id']] = [r['indicator_value'], r['indicator_weight']];
				})

				let indicator_avgWeight = {}
				if (j_data['coordinates'] === null) {
					for (let i of array) {
						switch (typeof j_data[i]) {
							case "string":
							case "number":
								result[i] = j_data[i];
								break;
							//case "object": //implicit
							default:
								result[i] = JSON.stringify(j_data[i]);
								break;
						}

						let w = 0;
						if (previous && result && previous[i] && result[i]) {
							if (previous[i][0] !== result[i].toString()) {
								w = fixedFingerprintWeight[i]
							}

							let avgWeightIndicator = (previous[i][1] + w) / 2

							if (avgWeightIndicator > previous[i][1]) {
								flags.push('true');
							} else {
								flags.push('false');
							}

							if (i !== 'coordinates') {
								db.insertOrUpdateFingerprintHistory(ist_id, i, result[i], avgWeightIndicator)
								indicator_avgWeight[i] = avgWeightIndicator
							}

						} else {
							db.insertOrUpdateFingerprintHistory(ist_id, i, null, -1)
							indicator_avgWeight[i] = null
						}
					}
					if (flags.length > 0) {
						let count = flags.filter(function (x) {
							return x === "true";
						}).length;

						let code = codeByRandomID.get(randomID);
						if (count >= flags.length * (4 / 5)) {
							code.insertConfidence(ist_id, 0) //failed
						} else if (count >= flags.length * (3 / 5) && count < flags.length * (4 / 5)) {
							code.insertConfidence(ist_id, 1) //meh
						} else if (count <= flags.length * (2 / 5)){
							code.insertConfidence(ist_id, 2) //ok
						}
					}

					db.updateFingerprintData(randomID, result.languages, result.colorDepth, result.deviceMemory, result.hardwareConcurrency, result.screenResolution, result.availableScreenResolution,
						result.timezoneOffset, result.sessionStorage, result.localStorage, result.platform, result.plugins, result.pixelDepth, result.adBlock, result.fonts, result.audio, result.gpu,
						'', '', '', '', '', '', '', '', '', '', '', ist_id,
						function (error, rows) {
							if (!error){
								db.updateFingerprintConfidence(attendance_id, ist_id, indicator_avgWeight.useragent, indicator_avgWeight.ip, indicator_avgWeight.languages, indicator_avgWeight.colorDepth,
									indicator_avgWeight.deviceMemory, indicator_avgWeight.hardwareConcurrency, indicator_avgWeight.screenResolution, indicator_avgWeight.availableScreenResolution,
									indicator_avgWeight.sessionStorage, indicator_avgWeight.localStorage, indicator_avgWeight.platform, indicator_avgWeight.plugins,
									indicator_avgWeight.fonts, indicator_avgWeight.audio, indicator_avgWeight.gpu,
								function(err, rows1){
									if (err) callback(err)
									else {
										db.updateCanvasFP(randomID, ist_id, result.canvas,
											function(err1, rows2){
												if (err1) callback(err1)
												else callback(err, rows)
											})
									}
								})
							}
						});



				} else {
					coord = j_data['coordinates']
					db.updateFingerprintDataLocal(randomID, coord["latitude"][0], coord["latitude"][1], coord["latitude"][2], coord["latitude"][3], coord["latitude"][4],
						coord["longitude"][0], coord["longitude"][1], coord["longitude"][2], coord["longitude"][3], coord["longitude"][4], coord["accur"], ist_id,
						function (error, rows) {
							callback(error, rows)
						}
					);
				}
			}
		);
	}
}


Service.prototype.getAttendanceInformation = function(db, attendanceID, callback) {
	db.getAttendanceInformation(attendanceID,function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.updateClassInformation = function(db, attendanceID, j, callback) {
	db.updateClassInformation(attendanceID, j, function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getStudentsHistoryByClass = function(db, ist_id, courseID, callback) {
	db.getStudentsHistoryByClass(ist_id, courseID,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getDegrees= function(year, callback) {
	fenix_api.requestDegrees(year,
		function(error, body) {
			if(error)
				callback(error)
			else {
				callback(error, body)
			}
		}
	)
}

Service.prototype.getCoursesFromDegree = function(degree, year, callback) {
	fenix_api.requestCoursesFromDegree(degree, year,
		function(error, body) {
			if(error)
				callback(error)
			else {
				callback(error, body)
			}
		}
	)
}

Service.prototype.isFenixCourse = function(db, courseID, callback) {
	db.isFenixCourse(courseID,
		function(error, body) {
			if(error)
				callback(error)
			else {
				callback(error, body)
			}
		}
	)
}



Service.prototype.getStudentsEnrolled = function(db, fenix_id, courseID, callback) {
	fenix_api.requestStudentsEnrolled(fenix_id,
		function(error, info) {
			var info_students = info["students"];
			if(!info_students || !info_students.length || info_students.length === 0) {
				callback(error);
			} else {
				let result_studentsenrolled = [];
				let studentsEnrolled = [];
				for(let k = 0; k < info_students.length; k++) {
					let enrolled_username = info_students[k]["username"];
					result_studentsenrolled.push([enrolled_username, courseID]);
					studentsEnrolled.push(enrolled_username);
				}
				db.insertStudentsEnrolled(result_studentsenrolled,
					function(error) {
						if(error) {
							callback(error);
						} else {
							callback(error, studentsEnrolled);
						}
					}
				);
			}
		}
	);
}


Service.prototype.getStudentsAttended = function(db, classNumber, callback){
	db.getStudentsAttended(classNumber,
		function(error, rows) {

			callback(error, rows);
		}
	);
}

Service.prototype.getStudentsAttendedFP = function(db, classNumber, courseID, shiftID, callback){
	db.getStudentsAttendedFP(classNumber, courseID, shiftID,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

function mostOccured(arr) {
	return arr.sort((a,b) => arr.filter(v => v===a && a && v).length - arr.filter(v => v===b && b && v).length).pop();
}

// TODO correct
Service.prototype.getAllLocationData = function(db, course_id, shift_id, class_number, callback) {
	db.getAttendanceStudentsLocation(course_id, shift_id, class_number,
		function(error, rows) {
			let sortByAttendance = {}
			for (let i = 0; i < rows.length; ++i){
				sortByAttendance[rows[i].attendanceID] = []
			}

			for (let i = 0; i < rows.length; ++i){
				let aux = Object.assign({}, rows[i]);
				delete aux.attendanceID
				sortByAttendance[rows[i].attendanceID].push(aux)
			}

			for (let k of Object.keys(sortByAttendance)) {
				let lat1 = []
				let lat2 = []
				let lat3 = []
				let lat4 = []
				let lat5 = []
				let long1 = []
				let long2 = []
				let long3 = []
				let long4 = []
				let long5 = []
				for (let i = 0; i < sortByAttendance[k].length; ++i) {
					if (sortByAttendance[k][i]['accuracyLat1'] && sortByAttendance[k][i]['accuracyLat1'].length > 0) lat1.push(sortByAttendance[k][i]['accuracyLat1'])
					if (sortByAttendance[k][i]['accuracyLat2'] && sortByAttendance[k][i]['accuracyLat2'].length > 0) lat2.push(sortByAttendance[k][i]['accuracyLat2'])
					if (sortByAttendance[k][i]['accuracyLat3'] && sortByAttendance[k][i]['accuracyLat3'].length > 0) lat3.push(sortByAttendance[k][i]['accuracyLat3'])
					if (sortByAttendance[k][i]['accuracyLat4'] && sortByAttendance[k][i]['accuracyLat4'].length > 0) lat4.push(sortByAttendance[k][i]['accuracyLat4'])
					if (sortByAttendance[k][i]['accuracyLat5'] && sortByAttendance[k][i]['accuracyLat5'].length > 0) lat5.push(sortByAttendance[k][i]['accuracyLat5'])
					if (sortByAttendance[k][i]['accuracyLong1'] && sortByAttendance[k][i]['accuracyLong1'].length > 0) long1.push(sortByAttendance[k][i]['accuracyLong1'])
					if (sortByAttendance[k][i]['accuracyLong2'] && sortByAttendance[k][i]['accuracyLong2'].length > 0) long2.push(sortByAttendance[k][i]['accuracyLong2'])
					if (sortByAttendance[k][i]['accuracyLong3'] && sortByAttendance[k][i]['accuracyLong3'].length > 0) long3.push(sortByAttendance[k][i]['accuracyLong3'])
					if (sortByAttendance[k][i]['accuracyLong4'] && sortByAttendance[k][i]['accuracyLong4'].length > 0) long4.push(sortByAttendance[k][i]['accuracyLong4'])
					if (sortByAttendance[k][i]['accuracyLong5'] && sortByAttendance[k][i]['accuracyLong5'].length > 0) long5.push(sortByAttendance[k][i]['accuracyLong5'])
				}

				let lat1_occur, lat2_occur, lat3_occur, lat3_occur_second, lat4_occur, lat4_occur_second, lat5_occur, lat5_occur_second, lat5_occur_third = null
				let long1_occur, long2_occur, long3_occur, long3_occur_second, long4_occur, long4_occur_second,	long5_occur, long5_occur_second, long5_occur_third = null

				/* find most commons in lat */
				if (lat1.length > 0)
					lat1_occur = mostOccured(lat1)
				else
					lat1_occur = ''

				if (lat2.length > 0)
					lat2_occur = mostOccured(lat2)
				else
					lat2_occur = ''

				if (lat3.length > 0) {
					lat3_occur = mostOccured(lat3)
					lat3 = lat3.filter(e => e !== lat3_occur);

					if (lat3.length > 0)
						lat3_occur_second = mostOccured(lat3)
					else
						lat3_occur_second = ''
				} else {
					lat3_occur = ''
				}

				if (lat4.length > 0) {
					lat4_occur = mostOccured(lat4)
					lat4 = lat4.filter(e => e !== lat4_occur);
					if (lat4.length > 0)
						lat4_occur_second = mostOccured(lat4)
					else
						lat4_occur_second = ''
				} else {
					lat4_occur = ''
				}

				if (lat5.length > 0) {
					lat5_occur = mostOccured(lat5)
					lat5 = lat5.filter(e => e !== lat5_occur);
					if (lat5.length > 0) {
						lat5_occur_second = mostOccured(lat5)
						lat5 = lat5.filter(e => e !== lat5_occur);
						if (lat5.length > 0)
							lat5_occur_third = mostOccured(lat5)
						else
							lat5_occur_third = ''
					}
					else
						lat5_occur_second = ''
				} else {
					lat5_occur = ''
				}

				/* find most commons in long */
				if (long1.length > 0)
					long1_occur = mostOccured(long1)
				else
					long1_occur = ''

				if (long2.length > 0)
					long2_occur = mostOccured(long2)
				else
					long2_occur = ''

				if (long3.length > 0) {
					long3_occur = mostOccured(long3)

				} else {
					long3_occur = ''
				}

				if (long4.length > 0) {
					long4_occur = mostOccured(long4)
					long4 = long4.filter(e => e !== long4_occur);
					if (long4.length > 0)
						long4_occur_second = mostOccured(long4)
					else
						long4_occur_second = ''
				} else {
					long4_occur = ''
				}

				if (long5.length > 0) {
					long5_occur = mostOccured(long5)
					long5 = long5.filter(e => e !== long5_occur);
					if (long5.length > 0) {
						long5_occur_second = mostOccured(long5)
						long5 = long5.filter(e => e !== long5_occur);
						if (long5.length > 0)
							long5_occur_third = mostOccured(long5);
						else
							long5_occur_third = ''
					} else
						long5_occur_second = ''
				} else {
					long5_occur = ''
				}

				for (let i = 0; i < sortByAttendance[k].length; ++i) {
					if (sortByAttendance[k][i]['accuracyLat1'] && sortByAttendance[k][i]['accuracyLat1'].length > 0) {
						if (sortByAttendance[k][i]['accuracyLat1'] === lat1_occur && sortByAttendance[k][i]['accuracyLong1'] === long1_occur) {
							sortByAttendance[k][i]['location-flag'] = 1

							if (sortByAttendance[k][i]['accuracyLat2'] === lat2_occur && sortByAttendance[k][i]['accuracyLong2'] === long2_occur) {
								sortByAttendance[k][i]['location-flag'] = 2

								//if ((sortByAttendance[k][i]['accuracyLat3'] === lat3_occur || sortByAttendance[k][i]['accuracyLat3'] === lat3_occur_second) && (sortByAttendance[k][i]['accuracyLong3'] === long3_occur || sortByAttendance[k][i]['accuracyLong3'] === long3_occur_second)) {
								if (sortByAttendance[k][i]['accuracyLat3'] === lat3_occur && sortByAttendance[k][i]['accuracyLong3'] === long3_occur) {
									sortByAttendance[k][i]['location-flag'] = 3

									if ((sortByAttendance[k][i]['accuracyLat4'] === lat4_occur || sortByAttendance[k][i]['accuracyLat4'] === lat4_occur_second) && (sortByAttendance[k][i]['accuracyLong4'] === long4_occur || sortByAttendance[k][i]['accuracyLong4'] === long4_occur_second)) {
										sortByAttendance[k][i]['location-flag'] = 4

										if ((sortByAttendance[k][i]['accuracyLat5'] === lat5_occur || sortByAttendance[k][i]['accuracyLat5'] === lat5_occur_second || sortByAttendance[k][i]['accuracyLat5'] === lat5_occur_third) && (sortByAttendance[k][i]['accuracyLong5'] === long5_occur || sortByAttendance[k][i]['accuracyLong5'] === long5_occur_second || sortByAttendance[k][i]['accuracyLong5'] === long5_occur_third)) {
											sortByAttendance[k][i]['location-flag'] = 5
										}
									}
								}
							}
						} else
							sortByAttendance[k][i]['location-flag'] = 0
					} else {
						sortByAttendance[k][i]['location-flag'] = -1
					}
				}
			}
			callback(error, sortByAttendance)

		}
	)
}

// TODO correct
Service.prototype.getStudentsLocation = function(db, course_id, shift_id, class_number, callback) {
	db.getStudentsLocation(course_id, shift_id, class_number,
		function(error, rows){
			let rows_nodup = []
			for (let i = rows.length-1; i >= 0; --i){
				if (rows_nodup.length){
					let notIn = true;
					for (let j = 0; j < rows_nodup.length; ++j){
						if (rows[i]['ist_id'] === rows_nodup[j]['ist_id']) notIn = false;
					}
					if (notIn) rows_nodup.push(rows[i])
				} else {
					rows_nodup.push(rows[i])
				}
			}

			let st = {}
			let lat1 = []
			let lat2 = []
			let lat3 = []
			let lat4 = []
			let lat5 = []
			let long1 = []
			let long2 = []
			let long3 = []
			let long4 = []
			let long5 = []

			for (let i = 0; i < rows_nodup.length; ++i){
				lat1.push(rows_nodup[i]['accuracyLat1'])
				lat2.push(rows_nodup[i]['accuracyLat2'])
				lat3.push(rows_nodup[i]['accuracyLat3'])
				lat4.push(rows_nodup[i]['accuracyLat4'])
				lat5.push(rows_nodup[i]['accuracyLat5'])
				long1.push(rows_nodup[i]['accuracyLong1'])
				long2.push(rows_nodup[i]['accuracyLong2'])
				long3.push(rows_nodup[i]['accuracyLong3'])
				long4.push(rows_nodup[i]['accuracyLong4'])
				long5.push(rows_nodup[i]['accuracyLong5'])
			}

			let lat1_occur, lat2_occur, lat3_occur, lat3_occur_second, lat4_occur, lat4_occur_second, lat5_occur, lat5_occur_second, lat5_occur_third
			let long1_occur, long2_occur, long3_occur, long3_occur_second, long4_occur, long4_occur_second, long5_occur, long5_occur_second, long5_occur_third
			if (lat1.length > 0)
				lat1_occur = mostOccured(lat1)
			else
				lat1_occur = null

			if (lat2.length > 0)
				lat2_occur = mostOccured(lat2)
			else
				lat2_occur = null

			if (lat3.length > 0) {
				lat3_occur = mostOccured(lat3)
				lat3 = lat3.filter(e => e !== lat3_occur);
				lat3_occur_second = mostOccured(lat3)
			} else {
				lat3_occur = null
				lat3_occur_second = null
			}

			if (lat4.length > 0) {
				lat4_occur = mostOccured(lat4)
				lat4 = lat4.filter(e => e !== lat4_occur);
				lat4_occur_second = mostOccured(lat4)
			} else {
				lat4_occur = null
				lat4_occur_second = null
			}

			if (lat5.length > 0) {
				lat5_occur = mostOccured(lat5)
				lat5 = lat5.filter(e => e !== lat5_occur);
				lat5_occur_second = mostOccured(lat5)
				lat5 = lat5.filter(e => e !== lat5_occur);
				lat5_occur_third = mostOccured(lat5)
			} else {
				lat5_occur = null
				lat5_occur_second = null
				lat5_occur_third = null
			}

			/* find most commons in long */
			if (long1.length > 0)
				long1_occur = mostOccured(long1)
			else
				long1_occur = null

			if (long2.length > 0)
				long2_occur = mostOccured(long2)
			else
				long2_occur = null

			if (long3.length > 0) {
				long3_occur = mostOccured(long3)
				long3 = long3.filter(e => e !== long3_occur);
				long3_occur_second = mostOccured(long3)
			} else {
				long3_occur = null
				long3_occur_second = null
			}

			if (long4.length > 0) {
				long4_occur = mostOccured(long4)
				long4 = long4.filter(e => e !== long4_occur);
				long4_occur_second = mostOccured(long4)
			} else {
				long4_occur = null
				long4_occur_second = null
			}

			if (long5.length > 0) {
				long5_occur = mostOccured(long5)
				long5 = long5.filter(e => e !== long5_occur);
				long5_occur_second = mostOccured(long5)
				long5 = long5.filter(e => e !== long5_occur);
				long5_occur_third = mostOccured(long5);
			} else {
				long5_occur = null
				long5_occur_second = null
				long5_occur_third = null
			}



			for (let i = 0; i < rows_nodup.length; ++i) {
				if (rows_nodup[i]['accuracyLat1'] && rows_nodup[i]['accuracyLat1'].length > 0) {
					if (lat1_occur && long1_occur && (rows_nodup[i]['accuracyLat1'] !== lat1_occur || rows_nodup[i]['accuracyLong1'] !== long1_occur)) {
						st[rows_nodup[i]['ist_id']] = ['flag', 1]
					} else {
						st[rows_nodup[i]['ist_id']] = ['flag', 1]
						if (lat2_occur && long2_occur && (rows_nodup[i]['accuracyLat2'] !== lat2_occur || rows_nodup[i]['accuracyLong2'] !== long2_occur)) {
							st[rows_nodup[i]['ist_id']] = ['flag', 2]
						} else {
							st[rows_nodup[i]['ist_id']] = ['flag', 2]
							if (lat3_occur && lat3_occur_second && long3_occur && long3_occur_second && ((rows_nodup[i]['accuracyLat3'] !== lat3_occur && rows_nodup[i]['accuracyLat3'] !== lat3_occur_second) || (rows_nodup[i]['accuracyLong3'] !== long3_occur && rows_nodup[i]['accuracyLong3'] !== long3_occur_second))) {
								st[rows_nodup[i]['ist_id']] = ['flag', 3]
							} else {
								st[rows_nodup[i]['ist_id']] = ['flag', 3]
								if (lat4_occur && lat4_occur_second && long4_occur && long4_occur_second && ((rows_nodup[i]['accuracyLat4'] !== lat4_occur && rows_nodup[i]['accuracyLat4'] !== lat4_occur_second) || (rows_nodup[i]['accuracyLong4'] !== long4_occur && rows_nodup[i]['accuracyLong4'] !== long4_occur_second))) {
									st[rows_nodup[i]['ist_id']] = ['flag', 4]
								} else {
									st[rows_nodup[i]['ist_id']] = ['flag', 4]
									if (lat5_occur && lat5_occur_second && lat5_occur_third && long5_occur && long5_occur_second && long5_occur_third && ((rows_nodup[i]['accuracyLat5'] !== lat5_occur && rows_nodup[i]['accuracyLat5'] !== lat5_occur_second && rows_nodup[i]['accuracyLat5'] !== lat5_occur_third) || (rows_nodup[i]['accuracyLong5'] !== long5_occur && rows_nodup[i]['accuracyLong5'] !== long5_occur_second && rows_nodup[i]['accuracyLong5'] !== long5_occur_third))) {
										st[rows_nodup[i]['ist_id']] = ['flag', 5]
									} else {
										st[rows_nodup[i]['ist_id']] = ['ok', 0]
									}
								}
							}
						}
					}
				} else {
					st[rows_nodup[i]['ist_id']] = ['noinfo', -1]
				}
			}
			callback(error, st)
		})
}


Service.prototype.getClassIsRemote = function(db, classNumber, courseID, shift_id, callback){
	db.getClassIsRemote(classNumber, courseID, shift_id,
		function(error, rows) {
			callback(error, rows);
		}
	);
}


Service.prototype.getClassIsRemoteByAttendanceID = function(db, attendanceID, callback){
	db.getClassIsRemoteByAttendanceID(attendanceID,
		function(error, rows) {
			callback(error, rows);
		}
	);
}


Service.prototype.getStudentsFP = function(db, ist_id, shift_id, course_id, class_number, callback){
	db.getStudentsFP(ist_id, shift_id, course_id, class_number,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getlastattendanceidforclass = function(db, shift_id, course_id, class_number, id, callback){
	db.getlastattendanceidforclass(shift_id, course_id, class_number, id,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getallindicatorconfidence = function(db, course_id, id, callback){
	db.getallindicatorconfidence(course_id, id,
		function(error, rows) {
			callback(error, rows);
		}
	);
}

Service.prototype.getStudentStatus = function(db, course, shift, classN, callback){
	db.getStudentStatus(course, shift, classN,
		function(error, rows) {
			callback(error, rows);
		}
	);
}


Service.prototype.getfixedFingerprintWeight = function(db, course, shift, classN, callback){
	db.getfixedFingerprintWeight(course, shift, classN,
		function(error, rows) {
			if(error) callback(error)
			else
				if(rows.length < 1) {
					db.getPreviousFutureFingerprintWeight(course, function(err, rows1){
						if (rows1){
							db.updateFixedWeight(course, shift, classN, rows1.useragent, rows1.ip, rows1.languages, rows1.colorDepth, rows1.deviceMemory, rows1.hardwareConcurrency, rows1.screenResolution, rows1.availableScreenResolution, rows1.sessionStorage, rows1.localStorage, rows1.platform, rows1.plugins, rows1.fonts, rows1.audio, rows1.gpu, rows1.adBlock, rows1.pixelDepth, false,
								function(err2){
									callback(err, rows1)
								})
						} else
							callback(err, rows1)
					})
				} else
					callback(error, rows);
		}
	);
}

Service.prototype.getFixedThresh = function(db, course, shift, classN, callback){
	db.getFixedThresh(course, shift, classN,
		function(error, rows) {
			if(error)
				callback(error)
			else
				callback(error, rows);
		}
	);
}


Service.prototype.getCourseIDByClassSecret = function(db, secret, callback){
	db.getCourseIDByClassSecret(secret,
		function(err, rows){
			callback(err, rows)
		})
}

Service.prototype.updateStatusForStudent = function(db, currentClass, courseID, shiftID, ist_id, state, callback){
	let state_aux = (state === 'complete') ? -1 : (state === 'late') ? 1 : (state === 'early') ? 2 : (state === 'middle') ? 3 : -1;
	db.getAttendancesByClassNumber(currentClass, courseID, shiftID, ist_id, function(error, rows){
		if (!error){
			for (let i = 0; i < rows.length; ++i){
				db.updateStatusForStudent(rows[i]['attendanceID'], ist_id, state_aux)
			}
			callback(error)
		} else {
			callback(error)
		}
	})
}

module.exports = Service;