var config = require('./default_config');
var database = require('./database/Database');
var Service = require('./Service');


var http = config.use_HTTPS ? require('https') : require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var mysql = require('mysql');
var request = require('request');
var moment = require('moment');
var Cookies = require('cookies');
const tinyurl = require("tinyurl-api");
const requestIp = require('request-ip');


var service = new Service();
var db = new database(150, config.mysql_host, config.mysql_user, config.mysql_pw, config.mysql_database);

const options = {
	key: config.use_HTTPS ? fs.readFileSync(config.tls_cert_key) : '',
	cert: config.use_HTTPS ? fs.readFileSync(config.tls_cert_crt) : '',
	ca: config.use_HTTPS ? fs.readFileSync(config.tls_cert_ca) : ''
};

function handleRequest(req, res) {
  	
  	var cookies = new Cookies(req, res);
	
	var parsedURL = url.parse(req.url, true);

	if(req.method == "POST") {
		getPostData(req, res, cookies, parsedURL);
		return;
	}

	switch(parsedURL.pathname) {
		case "/client":
			sendFile(res, 'client/prof.html');
			break;
		case "/api/H6YsZVWpIkXKeORd291yYLvEFfowzTcP3O5tRp9m/":
			break;
		case "/tsv/course/class":
			var secret = parsedURL.query.s;
			service.getAttendancesByClassSecret(db, secret,
				function(error, result) {
					if(error) {
						sendText(res, "Could not load PCM2021 attendances.", 500);
					} else {
						sendText(res, result+'\n', 200,
							'text/tab-separated-values; charset=utf-8');
					}
				}
			);
			break;
		case "/tsv/course/shift":
			var secret = parsedURL.query.s;
			service.getAttendancesByShiftSecret(db, secret,
				function(error, result) {
					if(error) {
						sendText(res, "Could not load PCM2021 attendances.", 500);
					} else {
						sendText(res, result+'\n', 200,
							'text/tab-separated-values; charset=utf-8');
					}
				}
			);
			break;
		case "/tsv/course":
			var secret = parsedURL.query.s;
			service.getAttendancesByCourseSecret(db, secret,
				function(error, result) {
					if(error) {
						sendText(res, "Could not load PCM2021 attendances.", 500);
					} else {
						sendText(res, result+'\n', 200,
							'text/tab-separated-values; charset=utf-8');
					}
				}
			);
			break;
		case "/api/H6YsZVWpIkXKeORd291yYLvEFfowzTcP3O5tRp9m/pcm2021_attendance.tsv":
			service.getAttendances(db,
				function(error, result) {
					if(error) {
						sendText(res, "Could not load PCM2021 attendances.", 500);
					} else {
						sendFile(res, 'studentsattending.tsv', 'text/plain; charset=utf-8', result);
					}
				}
				);
			break;
		case "/":
		case "/index.html":
			isLoggedInAsProf(res, cookies, parsedURL,
				function(ist_id, is_professor){
					if(is_professor) {
						sendFile(res, 'professor/professor_classes.html');
					} else {		//os alunos que sao profs nao vao ter acesso a pagina index.html dos alunos
						sendFile(res, 'student/student_index.html');
					}
				},
				function(){
					sendFile(res, 'index.html');
				}
			);
			break;
		case "/init.js":		// to disguise
			sendFile(res, 'fingerprint2.min.js', 'application/javascript');
			break;
		case "/this_is_a_prebid-ads_to_test.js":		// to disguise
			sendFile(res, 'this_is_a_prebid-ads_to_test.js', 'application/javascript');
			break;
		case "/qrcode.min.js":
			sendFile(res, 'qrcode.min.js', 'application/javascript');
			break;
		case "/login":
			disableCache(res);
			goToLogin(res, cookies, parsedURL);
			break;
		case '/img/insights-article-meeting-students-expectations-for-a-digital-campus.jpg':
				sendFile(res, '/img/insights-article-meeting-students-expectations-for-a-digital-campus.jpg', type='image/jpg');
			break;
		case '/img/insights-article-meeting-students-expectations-for-a-digital-campus-m.jpg':
			sendFile(res, '/img/insights-article-meeting-students-expectations-for-a-digital-campus-m.jpg', type='image/jpg');
			break;
		case '/img/plus.svg':
			sendFile(res, '/img/plus.svg', type='image/svg+xml');
			break;
		case '/img/alt.svg':
			sendFile(res, '/img/alt.svg', type='image/svg+xml');
			break;
		case '/img/polling.svg':
			sendFile(res, '/img/polling.svg', type='image/svg+xml');
			break;
		case '/img/phone.svg':
			sendFile(res, '/img/phone.svg', type='image/svg+xml');
			break;
		case '/img/laptop.svg':
			sendFile(res, '/img/laptop.svg', type='image/svg+xml');
			break;
		case '/img/information.svg':
			sendFile(res, '/img/information.svg', type='image/svg+xml');
			break;
		case '/img/statistics.svg':
			sendFile(res, '/img/statistics.svg', type='image/svg+xml');
			break;
		case '/img/fingerprint.svg':
			sendFile(res, '/img/fingerprint.svg', type='image/svg+xml');
			break;
		case '/img/fingerprint_ok.svg':
			sendFile(res, '/img/fingerprint_ok.svg', type='image/svg+xml');
			break;
		case '/img/fingerprint_failed.svg':
			sendFile(res, '/img/fingerprint_failed.svg', type='image/svg+xml');
			break;
		case '/img/fingerprint_maybe.svg':
			sendFile(res, '/img/fingerprint_maybe.svg', type='image/svg+xml');
			break;
		case '/img/add.svg':
			sendFile(res, '/img/add.svg', type='image/svg+xml');
			break;
		case '/img/typing.svg':
			sendFile(res, '/img/typing.svg', type='image/svg+xml');
			break;
		case '/img/admin.svg':
			sendFile(res, '/img/admin.svg', type='image/svg+xml');
			break;
		case '/img/check.svg':
			sendFile(res, '/img/check.svg', type='image/svg+xml');
			break;
		case '/img/cross.svg':
			sendFile(res, '/img/cross.svg', type='image/svg+xml');
			break;
		case '/img/delete.svg':
			sendFile(res, '/img/delete.svg', type='image/svg+xml');
			break;
		case '/img/fast-forward.svg':
			sendFile(res, '/img/fast-forward.svg', type='image/svg+xml');
			break;
		case '/img/group.svg':
			sendFile(res, '/img/group.svg', type='image/svg+xml');
			break;
		case '/img/information-button.svg':
			sendFile(res, '/img/information-button.svg', type='image/svg+xml');
			break;
		case '/img/link.svg':
			sendFile(res, '/img/link.svg', type='image/svg+xml');
			break;
		case '/img/logout.svg':
			sendFile(res, '/img/logout.svg', type='image/svg+xml');
			break;
		case '/img/pencil.svg':
			sendFile(res, '/img/pencil.svg', type='image/svg+xml');
			break;
		case '/img/placeholder.svg':
			sendFile(res, '/img/placeholder.svg', type='image/svg+xml');
			break;
		case '/img/placeholder_ok.svg':
			sendFile(res, '/img/placeholder_ok.svg', type='image/svg+xml');
			break;
		case '/img/placeholder_failed.svg':
			sendFile(res, '/img/placeholder_failed.svg', type='image/svg+xml');
			break;
		case '/img/placeholder_maybe.svg':
			sendFile(res, '/img/placeholder_maybe.svg', type='image/svg+xml');
			break;
		case '/img/square.svg':
			sendFile(res, '/img/square.svg', type='image/svg+xml');
			break;
		case '/img/square_ok.svg':
			sendFile(res, '/img/square_ok.svg', type='image/svg+xml');
			break;
		case '/img/square_failed.svg':
			sendFile(res, '/img/square_failed.svg', type='image/svg+xml');
			break;
		case '/img/square_maybe.svg':
			sendFile(res, '/img/square_maybe.svg', type='image/svg+xml');
			break;
		case '/img/settings.svg':
			sendFile(res, '/img/settings.svg', type='image/svg+xml');
			break;
		case '/img/late.svg':
			sendFile(res, '/img/late.svg', type='image/svg+xml');
			break;
        case '/img/calendar.svg':
            sendFile(res, '/img/calendar.svg', type='image/svg+xml');
            break;
		case '/img/lupa.svg':
			sendFile(res, '/img/lupa.svg', type='image/svg+xml');
			break;
        case '/img/admin_person.svg':
            sendFile(res, '/img/admin_person.svg', type='image/svg+xml');
            break;
		case '/img/user_person.svg':
            sendFile(res, '/img/user_person.svg', type='image/svg+xml');
            break;
		case '/img/favicon.png':
			sendFile(res, '/img/favicon.png', type='image/png');
			break;
		case "/style.css":
			sendFile(res, 'style.css', 'text/css');
			break;
		case "/script.js":
			sendFile(res, 'client/script.js');
			break;
		case "/logout":
			disableCache(res);
			isLoggedIn(res, cookies, parsedURL,
				function(ist_id){
					service.removeIAmHereToken(db, ist_id,
						function(error, success){
							if(success) {  
								redirectURL(res, "/");
							} else {
								console.log("Error logging out.", ist_id, error);
								sendText(res, "Error logging out.");
							}
						}
					);
				},
				function(){
					redirectURL(res, "/");
				}
			);
			break;
		case "/api/name":
			disableCache(res);
			isLoggedIn(res, cookies, parsedURL,
				function(ist_id){
					switch(parsedURL.pathname) {
						case "/api/name":
							service.getUserName(db, ist_id,
								function(name){
									sendText(res, name);
								}
							);
							break;
					}
				},
				function(){
					sendText(res, "Not logged in", 403);
				}
			);
			break;
		case "/api/isAdmin":
			disableCache(res);
			isLoggedIn(res, cookies, parsedURL,
				function(ist_id){
					switch(parsedURL.pathname) {
						case "/api/isAdmin":
							service.getisAdmin(db, ist_id,
								function(err){
									sendText(res, err);
								}
							);
							break;
					}
				},
				function(){
					sendText(res, "Not logged in", 403);
				}
			);
			break;
		case "/api/inactiveCourses":
		case "/api/getattendancehistory":
		case "/api/getattendancestats":
		case "/api/getattendancefp":
		case "/api/isremote":
		case "/api/isRemoteByRandomID":
		case "/api/getstudentfp":
		case "/api/getlastattendanceidforclass":
		case "/api/getallindicatorconfidence":
		case "/api/getStudentStatus":
		case "/api/getfixedFingerprintWeight":
		case "/api/getFixedThresh":
		case "/api/getLocation":
		case "/api/getnextclassnumber":
		case "/api/courses":
		case "/api/history":
		case "/api/academicTerms":
		case "/api/existingacademicterms":
		case "/api/existingcourses":
		case "/api/attendanceflow":
		case "/api/getMaxNClass":
		case "/api/getAttendedClasses":
		case "/api/fingerprint":
		case "/api/pcm2021attendance":
		case "/api/getallusers":
		case "/api/getAllLocationData":
		case "/api/getAllFingerprintData":
		case "/api/getConfidenceWeight":
		case "/api/getallenrolled":
		case "/api/getallteaching":
		case "/api/manuallyRemoveStudent":
		case "/api/students/attendanceHistory":
		case "/api/PCM2021/attendanceflow":
		case "/api/attendanceinfo":
		case "/api/shiftinfo":
		case "/api/attendancefile":
		case "/api/classattendancefile":
		case "/api/studentshistory":
		case "/api/getDegrees":
		case "/api/getCourseDegrees":
		case "/api/isFenixCourse":
		case "/api/professorsbycourse":
		case "/api/studentsbycourse":
		case "/api/shiftsbycourse":
		case "/api/attedancesbyClassNumber":
		case "/api/getshifts":
			disableCache(res);
			isLoggedInAsProf(res, cookies, parsedURL,
				function(ist_id, is_professor){
					if(false == is_professor){
						sendText(res, "User not authorized.", 403);
						return;
					}
					switch(parsedURL.pathname) {
						case "/api/inactiveCourses":
							service.getInactiveCourses(db, ist_id,
								function(error, rows) {
									sendJSON(res, rows);
								}
							);
							break;
						case "/api/academicTerms":
							service.getAllAcademicTerms(db, ist_id,
									function(error, rows) {
										sendJSON(res, rows);
									}
								);
							break;
						case "/api/existingacademicterms":
							service.getExistingAcademicTerms(db,
								function(error, rows) {
									sendJSON(res, rows);
								}
							);
							break;
						case "/api/existingcourses":
							service.getExistingCourses(db,
								function(error, rows) {
									sendJSON(res, rows);
								}
							);
							break;
						case "/api/getshifts":
							var courseID = parsedURL.query.c;
							service.getShiftsByCourseID(db, courseID,
									function(error, rows) {
										if(error) {
											sendText(res, "Could not getShiftsByCourseID.", 500);
										} else {
											sendJSON(res, rows);
										}
									}
								);
							break;
						case "/api/shiftinfo":
							var shiftid = parsedURL.query.s;
							service.getShiftsInfo(db, shiftid,
									function(error, result) {
										if(error) {
											sendText(res, "Could not getShiftsInfo.", 500);
										} else {
											sendJSON(res, result);
										}
									}
								);
							break;
						case "/api/professorsbycourse":
							var courseID = parsedURL.query.c;
							service.getProfessorsByCourse(db, courseID, ist_id,
									function(error, result) {
										if(error) {
											sendText(res, "Could not getProfessorsByCourse.", 500);
										} else {
											sendJSON(res, result);
										}
									}
								);
							break;
						case "/api/studentsbycourse":
							let course = parsedURL.query.c;
							service.getStudentsByCourse(db, course,
								function(error, result) {
									if(error) {
										sendText(res, "Could not getStudentsByCourse.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/shiftsbycourse":
							let c = parsedURL.query.c;
							service.getShiftsByCourse(db, c,
								function(error, result) {
									if(error) {
										sendText(res, "Could not getShiftsByCourse.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/attedancesbyClassNumber":
							let cn = parsedURL.query.cl;
							let course_attedancesbyClassNumber = parsedURL.query.c;
							let shift_attedancesbyClassNumber = parsedURL.query.s;
							service.getAttedancesbyClassNumber(db, cn, course_attedancesbyClassNumber, shift_attedancesbyClassNumber,
								function(error, result) {
									if(error) {
										sendText(res, "Could not getShiftsByCourse.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/studentshistory":
							var courseID = parsedURL.query.c;
							var ist_id = parsedURL.query.i;
							service.getStudentsHistoryByClass(db, ist_id, courseID,
									function(error, result) {
										if(error) {
											sendText(res, "Could not getStudentsHistoryByClass.", 500);
										} else {
											sendJSON(res, result);
										}
									}
								);
							break;
						case "/api/getDegrees":
							let year = parsedURL.query.ac;
							service.getDegrees(year,
								function(error, result) {
									if(error) {
										sendText(res, "Could not getDegrees.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/getCourseDegrees":
							let degree = parsedURL.query.de;
							let yearDegree = parsedURL.query.ac;
							service.getCoursesFromDegree(degree, yearDegree,
								function(error, result) {
									if(error) {
										sendText(res, "Could not getCourseDegrees.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/isFenixCourse":
							let fenixCourse = parsedURL.query.c;
							service.isFenixCourse(db, fenixCourse,
								function(error, result) {
									if(error) {
										sendText(res, "Could not isFenixCourse.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/classattendancefile":
							var courseID = parsedURL.query.c;
							var attendanceID = parsedURL.query.a;
							var shift = parsedURL.query.s;
							service.getAttendancesByCourseProfessorClass(db, courseID, ist_id, attendanceID, shift,
									function(error, result) {
										if(error) {
											sendText(res, "Could not getAttendancesByCourseProfessorClass.", 500);
										} else {
											sendText(res, result, 200,
												'text/tab-separated-values; charset=utf-8', 
												'attachment; filename="'+ist_id+courseID+attendanceID+'.tsv"');
										}
									}
								);
							break;
						case "/api/attendanceflow":
							var courseID = parsedURL.query.c;
							service.getAttendanceFlow(db, courseID,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAttendanceFlow.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
							break;
						case "/api/getMaxNClass":
							{
								let courseID = parsedURL.query.c;
								service.getMaxNclass(db, courseID,
									function(error, rows) {
										if(error) {
											sendText(res, "Could not getMaxNclass.", 500);
										} else {
											sendJSON(res, rows);
										}
									}
								);
							}
							break;
						case "/api/getAttendedClasses":
						{
							let courseID = parsedURL.query.c;
							let ist_id = parsedURL.query.sid;
							service.getAttendedClasses(db, courseID,ist_id,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAttendedClasses.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
						}
							break;
						case "/api/attendanceinfo":
							var attendanceID = parsedURL.query.a;
							service.getAttendanceInformation(db, attendanceID,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAttendanceInformation.", 500);
									} else {
										sendJSON(res, rows[0]);
									}
								}
							);
							break;
						case "/api/getallusers":
							service.getAllUsers(db,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAllUsers.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
							break;
						case "/api/getAllLocationData": {
							let classN = parseInt(parsedURL.query.cl);
							let courseID = parsedURL.query.c;
							let shiftID = parsedURL.query.s;
							service.getAllLocationData(db, courseID, shiftID, classN,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAllLocationData.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
						}
							break;
						case "/api/getAllFingerprintData":
						{
							let classN = parseInt(parsedURL.query.cl);
							let courseID = parsedURL.query.c;
							let shiftID = parsedURL.query.s;
							let istID = parsedURL.query.sid;
							service.getAllFingerprintData(db, classN, shiftID, courseID, istID,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAllFingerprintData.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
						}
							break;
						case "/api/getConfidenceWeight":{
							let classN = parseInt(parsedURL.query.cl);
							let courseID = parsedURL.query.c;
							let shiftID = parsedURL.query.s;
							service.getConfidenceWeight(db, courseID, shiftID, classN,
								function (error, rows) {
									if (error) {
										sendText(res, "Could not getConfidenceWeight", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
						}
							break;
						case "/api/getallenrolled":
							service.getEnrolledClasses(db,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getEnrolledClasses.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
							break;
						case "/api/getallteaching":
							service.getTeachingClasses(db,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getTeachingClasses.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
							break;
						case "/api/getnextclassnumber":
							var courseID = parsedURL.query.c;
							let shift_id_Class_number = parsedURL.query.s;
							service.getNextClassNumber(db, courseID, shift_id_Class_number,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getNextClassNumber.", 500);
									} else {
										sendJSON(res, rows)}
								}
							);
							break;
						case "/api/getattendancehistory":
							let classID_int = parseInt(parsedURL.query.cl);
							var attendanceID_int = parseInt(parsedURL.query.rid);
							let course_id1 = parsedURL.query.c
							let shift_id1 = parsedURL.query.s
							if(attendanceID_int && classID_int && course_id1 && shift_id1){
								service.getClassHistory(db, classID_int, attendanceID_int, course_id1, shift_id1,
									function(error, o) {
										if(error) {
											sendText(res, "Could not get class history.", 500);
										} else {
											sendJSON(res, o);
										}
									}
								);
							} else {
								sendText(res, "Invalid attendance link.");
							}
							break;
						case "/api/getattendancestats":
							let classNumber = parseInt(parsedURL.query.cl);
							if (classNumber) {
								service.getStudentsAttended(db, classNumber,
									function(error, o){
										if(error) {
											sendText(res, "Could not get class stats.", 500);
										} else {
											sendJSON(res, o);
										}
									}
								);
							}
							break;
						case "/api/getattendancefp": {
							let classN = parseInt(parsedURL.query.cl);
							let courseID = parsedURL.query.c;
							let shiftID = parsedURL.query.s;
							if (classN) {
								service.getStudentsAttendedFP(db, classN, courseID, shiftID,
									function (error, o) {
										if (error) {
											sendText(res, "Could not get class fingerprint.", 500);
										} else {
											sendJSON(res, o);
										}
									}
								);
							}
						}
							break;
						case "/api/getLocation": {
							let course_id = parsedURL.query.c;
							let shift_id = parsedURL.query.s;
							let class_n = parseInt(parsedURL.query.cl);
							if (course_id && class_n) {
								service.getStudentsLocation(db, course_id, shift_id, class_n,
									function (error, st) {
										if (error) {
											sendText(res, "Could not get class location.", 500);
										} else {
											sendJSON(res, st);
										}
									}
								);
							}
							break;
						}
						case "/api/isremote": {
							let class_number = parseInt(parsedURL.query.cl);
							let courseID = parsedURL.query.c;
							let shift_id = parsedURL.query.s;
							if (class_number) {
								service.getClassIsRemote(db, class_number, courseID, shift_id,
									function (error, o) {
										if (error) {
											sendText(res, "Could not getClassIsRemote.", 500);
										} else {
											sendJSON(res, o);
										}
									}
								);
							}
						}
							break;
						case "/api/isRemoteByRandomID": {
							let randomID = parseInt(parsedURL.query.c);
							if (randomID) {
								service.getAttendanceByRandomCode(db, randomID, function(error, attendanceID) {
									service.getClassIsRemoteByAttendanceID(db, attendanceID[0]['attendanceID'],
										function(error, j) {
											if(error) {
												sendText(res, "Error getClassIsRemote.", 500);
											} else {
												sendJSON(res, j);
											}
										}
									);
								})
							}
						}
							break;
						case '/api/getstudentfp':
							let id = parsedURL.query.ss;
							let s = parsedURL.query.s;
							let co = parsedURL.query.c;
							let cl = parseInt(parsedURL.query.cl);
							if (id && s && co && cl) {
								service.getStudentsFP(db, id, s, co, cl,
									function(error, o){
										if(error) {
											sendText(res, "Could not get student fp.", 500);
										} else {

											sendJSON(res, o);
										}
									}
								);
							}
							break;
						case "/api/getlastattendanceidforclass":
							let s_att = parsedURL.query.s;
							let co_att = parsedURL.query.c;
							let cl_att = parseInt(parsedURL.query.cl);
							let id_att = parsedURL.query.id;
							if (s_att && co_att && cl_att) {
								service.getlastattendanceidforclass(db, s_att, co_att, cl_att,id_att,
									function(error, o){
										if(error) {
											sendText(res, "Could not getlastattendanceidforclass.", 500);
										} else {

											sendJSON(res, o);
										}
									}
								);
							}
							break;
						case "/api/getallindicatorconfidence":
							let c_allind = parsedURL.query.c;
							let id_allind = parsedURL.query.id;
							service.getallindicatorconfidence(db, c_allind,id_allind,
								function(error, o){
									if(error) {
										sendText(res, "Could not getallindicatorconfidence.", 500);
									} else {

										sendJSON(res, o);
									}
								}
							);
							break;
						case "/api/getStudentStatus":
							{
								let course = parsedURL.query.c;
								let shift = parsedURL.query.s;
								let classN = parsedURL.query.cl
								service.getStudentStatus(db, course, shift, classN,
									function(error, o){
										if(error) {
											sendText(res, "Could not getStudentStatus.", 500);
										} else {
											sendJSON(res, o);
										}
									}
								);
							}
							break;
						case "/api/getfixedFingerprintWeight":
							{
								let course = parsedURL.query.c;
								let shift = parsedURL.query.s;
								let classN = parsedURL.query.cl
								service.getfixedFingerprintWeight(db, course, shift, classN,
									function(error, o){
										if(error) {
											sendText(res, "Could not getfixedFingerprintWeight.", 500);
										} else {
											sendJSON(res, o);
										}
									}
								);
							}
							break;
						case "/api/getFixedThresh":
						{
							let course = parsedURL.query.c;
							let shift = parsedURL.query.s;
							let classN = parsedURL.query.cl
							service.getFixedThresh(db, course, shift, classN,
								function(error, o){
									if(error) {
										sendText(res, "Could not getFixedThresh.", 500);
									} else {
										sendJSON(res, o);
									}
								}
							);
						}
							break;
						case "/api/courses":
							var academicTerm = parsedURL.query.ac;
							service.selectCourseInfo(db, ist_id, academicTerm,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not select course info.", 500);
									} else {
										sendJSON(res, rows);
									}
								}
							);
							break;
						case "/api/history":
							var courseID = parsedURL.query.c;
							var new_professor = parsedURL.query.i;
							var shift = parsedURL.query.s;
							if(!new_professor) {
								new_professor = ist_id;
							}
							service.getAttendanceHistory(db, new_professor, courseID, shift,
								function(error, result) {
									if(error) {
										sendText(res, "Could not get attendande history.", 500);
									} else {
										sendJSON(res, result);
									}
								}
							);
							break;
						case "/api/fingerprint":
							var attendanceID_int = parseInt(parsedURL.query.f);
							var student_id = parsedURL.query.i;
							service.getFingerprintData(db, student_id, attendanceID_int,
								function(error, rows){
									if(error) {
										sendText(res, "Could not load fingerprint", 500);
									} else{
										sendJSON(res, rows);	
									}
								}
							);
							break;
						case "/api/pcm2021attendance":
							sendFile(res, 'studentsattending.tsv', 'text/plain; charset=utf-8');
							break;
						case "/api/manuallyRemoveStudent":
							var student_id = parsedURL.query.i;
							let class_manuallyremove = parseInt(parsedURL.query.cl)
							let course_manuallyremove = parsedURL.query.c
							let shift_manuallyremove = parsedURL.query.s
							service.getAttendancesByClassNumber(db, class_manuallyremove, course_manuallyremove, shift_manuallyremove, student_id,
								function(error, rows) {
									if (error) sendText(res, "Could not getAttendancesByClassNumber", 500);
									else {
											db.manuallyRemoveStudent(student_id, rows[rows.length-1]['attendanceID'],
												function (error1) {
													if (error1) sendText(res, "Could not manuallyRemoveStudent", 500);
												}
											);
										//}
										sendJSON(res, rows[0]['attendanceID']);
									}
								}
							);
							break;

						case "/api/students/attendanceHistory":
							var student_id = parsedURL.query.n;
							service.getStudentAttendanceHistory(db, student_id,
								function(error, rows){
									if(error) {
										sendText(res, "Could not get student's attendance history", 500);
									} else{
										sendJSON(res, rows);	
									}
								}
							);
							break;
						case "/api/PCM2021/attendanceflow":
							service.getPCM2021AttendanceFlow(
								function(error, rows){
									if(error) {
										sendText(res, "Could not get PCM2021 attendance flow", 500);
									} else{
										sendJSON(res, rows);
									}
								}
							);
							break;
					}
				},
				function(){
					sendText(res, "Not logged in", 403);
				}
			);
			break;
		case "/a":
		case "/student":
			makeUserLogin(res, cookies, parsedURL,
				function(ist_id){
					switch(parsedURL.pathname) {
						case "/a":
							var randomID_int = parseInt(parsedURL.query.c);
							if(!randomID_int) {
								sendText(res, "Invalid attendance link.");
								return;
							}
							var useragent = req.headers['user-agent'];
							const user_ip = requestIp.getClientIp(req);
							service.verifyRandomID(db, randomID_int, ist_id, useragent, user_ip,
								function(error, isValid, isChecked, canAccess){
									if(error) {
										console.log("Error in verifyRandomID (probably while saving fingerprint; page still served).");
									}
									if(isValid){
										if(!canAccess) {
											sendText(res, 'You are not enrolled in this course. Please talk to the professor at the end of the class.');
										}
										else if(isChecked) {
											sendText(res, 'Attendance already checked for this session.');
										} else {
											let code_type = service.getAttendanceTypeByRandomID(randomID_int);
											let extraText = "";		// keyboard number
											if(code_type === "N") {
												extraText = "<script>setNumberK();</script>";
											}
											sendFile(res, 'student/student.html', 'text/html', extraText);
													
										}
									} else {
										cookies.set('invalid_code', true, {httpOnly: false});
										sendFile(res, 'student/student_index.html');
									}
								}
							);
							break;
						case "/student":
							sendFile(res, 'student/student.html');
							break;
						default:
							console.log('This should not happen');
							sendText(res, "Error.", 501);
							break;
					}
				} 
			);
			break;
		case "/admin":
		case "/professor":
		case "/professor/new":
		case "/professor/attendance":
		case "/professor/previousattendance":
		case "/professor/studentslist":
		case "/professor/courses":
		case "/professor/classes":
		case "/professor/addcourse":
		case "/professor/addcourseFenix":
			makeProfessorLogin(res, cookies, parsedURL,
				function(ist_id, is_professor){
					if(false == is_professor){
						sendText(res, "User not authorized.", 403);
						return;
					}
					switch(parsedURL.pathname) {
						case "/admin":
							sendFile(res, 'professor/admin.html');
							break;
						case "/professor":
							sendFile(res, 'professor/professor_classes.html');
							break;
						case "/professor/studentslist":
							sendFile(res, 'professor/professor_studentslist.html');
							break;
						case "/professor/new":
							sendFile(res, 'professor/professor_new.html');
							break;
						case "/professor/attendance":
							sendFile(res, 'professor/professor_attendance.html');
							break;
						case "/professor/previousattendance":
							sendFile(res, 'professor/professor_previous_attendance.html');
							break;
						case "/professor/courses":
							sendFile(res, 'professor/professor_classes.html');
							break;
						case "/professor/classes":
							sendFile(res, 'professor/professor_classes.html');
							break;
						case "/professor/addcourse":
							cookies.set('view', 1, {httpOnly: false});
							sendFile(res, 'professor/professor_addcourse.html');
							break;
						case "/professor/addcourseFenix":
							cookies.set('view', 2, {httpOnly: false});
							sendFile(res, 'professor/professor_addcourse.html');
							break;
						default:
							console.log('This sould not happen');
							sendText(res, "Error.", 501);
							break;
					}
				}
			);
			break;
		case "/oauth":
			var fenix_code = parsedURL.query.code;
			service.getAccessToken(db, res, fenix_code,
				function(iamhere_token){
					cookies.set('login', iamhere_token);
					var last_url = cookies.get('last_url');
					if(last_url && last_url == "/login") {
						redirectURL(res, "/");
					} else if(last_url) {
						redirectURL(res, last_url);
					} else {
						redirectURL(res, "/");	
					}
				}
			);
			break;
		default:
			sendText(res, "File not found.", 404);
			break;
	}
}

var server = http.createServer(options, function (req, res) {
	try {
		return handleRequest(req, res);
	} catch (error) {
		try {
			console.log("Exception in handleRequest:", error);
			if(!req.finished) {
				sendText(res, "Internal server error.", 503);
			}
		} catch(error2) {
			console.error("Exception while handling handleRequest Exception:", error2);
		}
	}
});

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('error', function(e) {
	console.log("Server error", e);
});

server.on('listening', function() {
	console.log("Server listening on", server.address());
});

service.deserializedAttendancesFromLastDay(db,
				function(error, attendances){
					if(error) {
						console.log("Error in deserializedAttendancesFromLastDay", 500);
					} else {
						for(a of attendances) {
							console.log("Loaded attendanceID: ", a);
						}
					}
				});

server.listen(config.PORT); //the server object listens on config.PORT

function disableCache(res) {
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
}


function redirectURL(res, url) {
	res.writeHead(302,
		{Location: url}
	);
	res.end();
}


function goToLogin(res, cookies, parsedURL) {
	cookies.set('last_url', parsedURL.path);
	console.log('Saving last_url as', parsedURL.path);
	redirectURL(res, config.EXTERNAL_LOGIN_URL);	
}

function isLoggedInAsProf(res, cookies, parsedURL, callback_true, callback_false) {
	return isLoggedIn(res, cookies, parsedURL, callback_true, callback_false, true);
}

function isLoggedIn(res, cookies, parsedURL, callback_true, callback_false, needsBeProf = false) {
	var token = cookies.get('login');
	service.verifyLogin(db, token,
		function(ist_id){
			if(ist_id != null){
				if(needsBeProf) {
					service.isProfessor(db, ist_id,
						function(error, is_professor) {
							callback_true(ist_id, is_professor);
						}
					);
				} else {
					callback_true(ist_id);
				}
			}
			else {
				callback_false();
			}
		}
	);
}

function makeUserLogin(res, cookies, parsedURL, callback) {
	isLoggedIn(res, cookies, parsedURL,
		//callback_true
		function(ist_id){
			console.log("IsLogged in as: ", ist_id);
			callback(ist_id);
		},
		//callback_false
		function(){
			console.log("isNOTlogged in.");
			goToLogin(res, cookies, parsedURL);
		}
	);
}

function makeProfessorLogin(res, cookies, parsedURL, callback) {
	isLoggedInAsProf(res, cookies, parsedURL,
		//callback_true
		function(ist_id, is_professor){
			console.log("Professor isLogged in as: ", ist_id);
			callback(ist_id, is_professor);
		},
		//callback_false
		function(){
			console.log("Professor isNOTlogged in.");
			goToLogin(res, cookies, parsedURL);
		}
	);
}

function sendText(res, text, status = 200, mime = 'text/plain', disposition = "inline") {
	res.writeHead(status, {
		'Content-Type': mime,
		'Content-Disposition': disposition
	});
	res.write(text, function(err){
		res.end();
	});
}

function sendFile(res, filename, type = 'text/html', moreText = "", disposition = "inline") {
	var filePath = path.join(__dirname, filename);
    var stat = fs.statSync(filePath);

    res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': stat.size + Buffer.byteLength(moreText, 'utf8'), //moreText.length
        'Content-Disposition': disposition
    });

    var readStream = fs.createReadStream(filePath);
    readStream.pipe(res, {end: moreText.length == 0});
    if(moreText.length != 0){
    	readStream.on("end", () => {
    		res.write(moreText,
    			function(err) {
    				res.end();
    			}
    		);
    	});
    }
}

function sendJSON(res, json, status = 200) {
	res.writeHead(status, {'Content-Type': 'application/json'});

	res.write(JSON.stringify(json),
		function(err) {
			res.end();
		}
	);
}

function getPostData(req, res, cookies, parsedURL) {
	var data = '';
	req.on('data', chunk => {
		if(data.length > 1024) {
			res.end('Input data too big.');
			return;
		}
		data += chunk.toString();
	});
	req.on('end', () => {
		handlePost(req, res, cookies, parsedURL, data);
	});
}

function handlePost(req, res, cookies, parsedURL, data) {
	switch(parsedURL.pathname) {
		case "/api/validatecode":
		case "/api/init":
			isLoggedIn(res, cookies, parsedURL,
				function(ist_id) {
					try {
						var json = JSON.parse(data);
					} catch(e) {
						console.log("Invalid or empty POST data.");
						var json = {};
					}
					var randomID = json.randomID;
					switch(req.url) {
						case "/api/validatecode":
							var client_code = json.input_code;

							console.log("server post validadecode", client_code)


							service.validateCode(db, res, randomID, client_code, ist_id,
								function(error, result) {
									if(error) {
										if(typeof error == 'string') {
											sendText(res, "Haha. You are not enrolled.", 403);
										}
										sendText(res, "Error validating code.", 500);
									} else {
										sendJSON(res, result);

									}
								}
							);
							break;
						case "/api/init":
							let user_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
							if (user_ip.substr(0, 7) === "::ffff:") {
								user_ip = user_ip.substr(7)
							}

							json['my_data']['ip'] = user_ip;
							service.getAttendanceByRandomCode(db, randomID, function(error, attendanceID) {
									service.updateFingerprintData(db, randomID, json, ist_id, attendanceID[0]['attendanceID'],
										function(error, j) {
											if(error) {
												sendText(res, "Error updateFingerprintData.", 500);
											} else {
												sendJSON(res, j);
											}
										}
									);
								})

							break;
					}
				},
				function() {
					sendText(res, "Not logged in", 403);
				}
			);
			break;
		case "/api/closeAttendance":
		case "/api/courseInUse":
		case "/api/createAttendanceSession":
		case "/api/status":
		case "/api/getcode":
		case "/api/loadshifts":
		case "/api/importstudents":
		case "/api/getcode/stop":
		case "/api/addmanually":
		case "/api/setLate":
		case "/api/addcourse":
		case "/api/updateClassInformation":
		case "/api/manuallyRemoveAttendance":
		case "/api/manuallyUpdateAttendance":
		case "/api/importattendance":
		case "/api/insertshift":
		case "/api/updateCourse":
		case "/api/manuallyRemoveShift":
		case "/api/manuallyRemoveCourse":
		case "/api/manuallyremoveacademicterm":
		case "/api/updateAdmin":
		case "/api/insertacademicterm":
		case "/api/updateStudentStatus":
		case "/api/updateFixedWeight":
		case "/api/updateFixedThresh":
		case "/api/updateConfidenceWeight":
		case "/api/insertprofessor":
		case "/api/updateStatusForStudent":
		case "/api/removeprofessor":
			isLoggedInAsProf(res, cookies, parsedURL,
				function(ist_id, is_professor){
					if(false == is_professor){
						sendText(res, "User not authorized.", 403);
						return;
					}
					var json = JSON.parse(data);
					var randomID = json.randomID;
					switch(parsedURL.pathname) {
						case "/api/insertprofessor":
							service.insertManuallyProfessor(db, json.ist_id, json.courseID,
								function(error){
									if(error) {
										sendText(res, "Could not insertManuallyProfessor", 500);
									} else{
										sendText(res, "Professor inserted.");	
									}
								}
							);
							break;
						case "/api/insertacademicterm":
							service.insertacademicterm(db, json.academicterm,
								function(error){
									if(error) {
										sendText(res, "Could not insertacademicterm", 500);
									} else{
										sendText(res, "Academic Term inserted.");
									}
								}
							);
							break;
						case "/api/updateStudentStatus":
							service.updateStudentStatus(db, json.totalAttendances, json.specificAttendance, json.specificLate, json.specificEarly, json.courseID, json.shiftID, json.classNumber,
								function(error){
									if(error) {
										sendText(res, "Could not updateStudentStatus", 500);
									} else{
										sendText(res, "Academic Term inserted.");
									}
								}
							);
							break;
						case "/api/updateFixedWeight":
							if (json.type_update === 'class') {
								service.updateFixedWeight(db, json.courseID, json.shiftID, json.classNumber, json, false,
									function (error) {
										if (error) {
											sendText(res, "Could not updateFixedWeight", 500);
										} else {
											sendText(res, "Fixed Weights updated.");
										}
									}
								);
							} else if (json.type_update === 'class_and_future'){
								service.updateFixedWeight(db, json.courseID, json.shiftID, json.classNumber, json, true,
									function (error) {
										if (error) {
											sendText(res, "Could not updateFixedWeight", 500);
										} else {
											sendText(res, "Fixed Weights updated.");
										}
									}
								);

							} else if ((json.type_update === 'all_class')) {
								service.getShiftsByCourse(db, json.courseID, function (errCourse, rows_course){
									if (errCourse) sendText(res, "Could not updateFixedWeight", 500);

									else if (rows_course.length > 0){
										for (let i = 0; i < rows_course.length; ++i){
											service.getClassByShiftID(db, json.courseID, rows_course[i]['shift_id'], function (errShift, rows_shift){
												if (errShift) sendText(res, "Could not updateFixedWeight", 500);

												else if (rows_shift.length > 0){
													for (let j = 0; j < rows_shift.length; ++j){
														service.updateFixedWeight(db, json.courseID, rows_course[i]['shift_id'], rows_shift[j]['number'], json, (j === rows_shift.length - 1),
															function (error) {
																if (error) {
																	sendText(res, "Could not updateFixedWeight", 500);
																}
															}
														);
													}
													sendText(res, "Fixed Weights updated.");
												}
											})
										}
									}
								})
							}
							break;
						case "/api/updateFixedThresh":
						{
							service.updateFixedThresh(db, json.courseID, json.shiftID, json.classNumber, json.type_update, json.fail_thresh, json.ok_thresh,
								function (error) {
									if (error) {
										sendText(res, "Could not updateFixedThresh", 500);
									} else {
										sendText(res, "Fixed Thresh updated.");
									}
								}
							);
						}
							break;
						case "/api/updateConfidenceWeight":{
							if (json.type_update === 'classConfidence') {
								service.updateConfidenceWeight(db, json.courseID, json.shiftID, json.classNumber, json, false,
									function (error) {
										if (error) {
											sendText(res, "Could not updateConfidenceWeight", 500);
										} else {
											sendText(res, "Fixed Weights updated.");
										}
									}
								);
							} else if (json.type_update === 'class_and_futureConfidence') {
								service.updateConfidenceWeight(db, json.courseID, json.shiftID, json.classNumber, json, true,
									function (error) {
										if (error) {
											sendText(res, "Could not updateConfidenceWeight", 500);
										} else {
											sendText(res, "Fixed Weights updated.");
										}
									}
								);
							} else if ((json.type_update === 'all_classConfidence')) {
								service.getShiftsByCourse(db, json.courseID, function (errCourse, rows_course){
									if (errCourse) sendText(res, "Could not updateConfidenceWeight", 500);

									else if (rows_course.length > 0){
										for (let i = 0; i < rows_course.length; ++i){
											service.getClassByShiftID(db, json.courseID, rows_course[i]['shift_id'], function (errShift, rows_shift){
												if (errShift) sendText(res, "Could not updateConfidenceWeight", 500);

												else if (rows_shift.length > 0){
													for (let j = 0; j < rows_shift.length; ++j){
														service.updateConfidenceWeight(db, json.courseID, rows_course[i]['shift_id'], rows_shift[j]['number'], json, (j === rows_shift.length - 1),
															function (error) {
																if (error) {
																	sendText(res, "Could not updateConfidenceWeight", 500);
																}
															}
														);
													}
													sendText(res, "Confidence Weights updated.");
												}
											})
										}
									}
								})
							}
						}
							break;
						case "/api/updateStatusForStudent":{
							service.updateStatusForStudent(db, json.currentClass, json.courseID, json.shiftID, json.ist_id, json.state,
								function(error){
									if(error) {
										sendText(res, "Could not updateStatusForStudent", 500);
									} else{
										sendText(res, "updateStatusForStudent complete.");
									}
								}
							);
						}
							break;
						case "/api/removeprofessor":
							service.removeProfessorFromCourse(db, json.ist_id, json.courseID,
								function(error){
									if(error) {
										sendText(res, "Could not removeProfessorFromCourse", 500);
									} else{
										sendText(res, "Professor removed.");	
									}
								}
							);
							break;
						case "/api/updateAdmin": //TODO
							service.updateAdmin(db, json.ist_id, json.operation,
								function(error){
									if(error) {
										sendText(res, "Could not updateAdmin", 500);
									} else{
										sendText(res, "Updated admin.");
									}
								}
							);
							break;
						case "/api/manuallyRemoveAttendance":
							let classNumber_mra = parseInt(parsedURL.query.a);
							let course_mra = parsedURL.query.c;
							let shift_mra = parsedURL.query.s;
							service.manuallyRemoveAttendance(db, classNumber_mra, course_mra, shift_mra,
								function(error){
									if(error) {
										sendText(res, "Could not manuallyRemoveAttendance", 500);
									} else{
										sendText(res, "Attendance removed.");	
									}
								}
							);
							break;
						case "/api/manuallyUpdateAttendance":
							let classNumber_mua = parseInt(parsedURL.query.a);
							let course_mua = parsedURL.query.c;
							let shift_mua = parsedURL.query.s;
							let classNumber_mua_new = parseInt(parsedURL.query.new_cl);
							let title_mua_new = parsedURL.query.new_title;
							service.manuallyUpdateAttendance(db, classNumber_mua, course_mua, shift_mua, classNumber_mua_new, title_mua_new,
								function(error){
									if(error) {
										sendText(res, "Could not manuallyRemoveAttendance", 500);
									} else{
										sendText(res, "Attendance removed.");
									}
								}
							);
							break;
						case "/api/importstudents":
							service.updateStudentNameAndNumber(db, json.file_input, json.courseID,
								function(error){
									if(error) {
										sendText(res, "Could not updateStudentNameAndNumber", 500);
									} else{
										sendText(res, "Student(s) imported.");	
									}
								}
							);
							break;
						case "/api/insertshift":
							if (!json.update){
								service.insertShift(db, json,
									function(error) {
										if (error) {
											sendText(res, "Could not insertShift.", 500);
										} else {
											sendText(res, "Ok.", 200);
										}
									});
							} else {
								service.updateShift(db, json,
									function(error) {
										if (error) {
											sendText(res, "Could not updateShift.", 500);
										} else {
											sendText(res, "Ok.", 200);
										}
									});
							}

							break;
						case "/api/updateCourse":
							service.updateCourse(db, json,
								function(error) {
									if (error) {
										sendText(res, "Could not updateCourse.", 500);
									} else {
										sendText(res, "Ok.", 200);
									}
								}
							);
							break;
						case "/api/manuallyRemoveShift":
							var shiftID = json.shift_id;
							service.manuallyRemoveShift(db, shiftID,
								function(error){
									if(error) {
										sendText(res, "Could not manuallyRemoveShift", 500);
									} else{
										sendText(res, "Shift removed.", 200);
									}
								}
							);
							break;
						case "/api/manuallyRemoveCourse":{
							let courseID = json.courseID;
							service.manuallyRemoveCourse(db, courseID,
								function(error){
									if(error) {
										sendText(res, "Could not manuallyRemoveCourse", 500);
									} else{
										sendText(res, "Course removed.", 200);
									}
								}
							);
						}
							break;
						case "/api/manuallyremoveacademicterm":
							let academic_term = json.academicterm;
							service.manuallyremoveacademicterm(db, academic_term,
								function(error){
									if(error) {
										sendText(res, "Could not manuallyremoveacademicterm", 500);
									} else{
										sendText(res, "Academic term removed.", 200);
									}
								}
							);
							break;
						case "/api/loadshifts":
							var courseID = json.courseID;
							service.insertCourseShiftInfo(db, courseID,
								function(error) {
									if(error) {
										sendText(res, "Could not insertCourseShiftInfo", 500);
									} else {
										sendText(res, "Shift(s) inserted.");
									}
								}
							);
							break;
						case "/api/importattendance":
							let isExtra = 0;
							if(json.is_extra == "is_extra") {
								isExtra = 1;
							}
							service.createandinsertstudents(db, json.courseID, json.professor_number, isExtra, json.mytitle, json.class_number, json.file_input, json.shift,
								function(error) {
									if(error) {
										sendText(res, "Error in /api/importattendance", 500);
									} else {
										sendText(res, "Class and student(s) imported.");
									}
								}
							)
							break;
						case "/api/updateClassInformation":
							var attendanceID = parsedURL.query.a;
							service.updateClassInformation(db, attendanceID, json,
								function(error, rows) {
									if(error) {
										sendText(res, "Could not getAttendanceFlow.", 500);
									} else {
										sendText(res, "Ok.");
									}
								}
							);
							break;
						case "/api/courseInUse":
							var courseID = json.courseID;
							service.setCourseToInUse(db, ist_id, courseID,
								function(error) {
									if(error) {
										sendText(res, "Could not courseInUse.", 500);
									} else {
										sendText(res, "Ok.");
									}
								}
							);
							break;
						case "/api/addcourse":
							var courseName = json.courseName;
							var courseID = json.courseID;
							var academicTerm = json.academicTerm;
							service.insertProfessorandCourse(db, ist_id, (json.fenixID ? courseName : courseID), (json.fenixID ? courseID : courseName ), academicTerm, (json.fenixID ? json.fenixID : ''),
								function(error) {
									if(error) {
										sendText(res, "Could not addcourse.", 500);
									} else {
										sendText(res, "Ok");
									}
								}
							);
							break;
						case "/api/setLate":
							var attendanceID_int = json.a;
							var ist_id = json.i;
							var isLate = json.late;
							service.setLate(db, attendanceID_int, ist_id, isLate,
								function(error) {
									if(error) {
										sendText(res, "Could not setLate.", 500);
									} else {
										sendText(res, "Ok");
									}
								}
							);
							break;
						case "/api/closeAttendance":
							service.closeAttendance(db, randomID,
								function(status) {
									sendJSON(res, status);
								}
							);
							break;
						case "/api/status":
							service.getStatus(db, ist_id, randomID,
								function(status) {
									sendJSON(res, status);
								}
							);
						break;
						case "/api/getcode/stop":
							service.stopProcess(ist_id, randomID,
								function(status) {
									sendJSON(res, status);
								}
							);
							break;
						case "/api/getcode":
							service.generateCode(ist_id, randomID,
								function(status) {
									sendJSON(res, status);
								}
							);
							break;
						case "/api/validatecode":
							console.log("server post validadecode")
							var client_code = json.input_code;
							service.validateCode(db, res, randomID, client_code, ist_id,
								function(error, result) {
									if(error) {
										sendText(res, "Error validating code.", 500);
									} else {
										sendJSON(res, result);	
									}
								}
							);
							break;
						case "/api/createAttendanceSession":
							var json = JSON.parse(data);
							let is_extra = json.is_extra == "is_extra" ? 1 : 0;
							let remote = json.remoteSession ? 1 : 0; // TODO implement this later
							if(json.onlyEnrolledStudents == "true") {
								service.getFenixIDByCourseID(db, json.courseID,
									function(error1, fenix_id) {
										service.getStudentsEnrolled(db, fenix_id, json.courseID,
											function(error2, studentsEnrolled) {
												createAttendance(db, res, ist_id, json, is_extra, studentsEnrolled);
											}
										);
									}
								);
							} else {
								createAttendance(db, res, ist_id, json, is_extra);
							}
							break;
						case "/api/addmanually": {
							let json = JSON.parse(data);
							let isLate = json.late && json.late === "late";
							if (!isLate) { // on time
								service.getAttendanceByAttendanceAndClassNumber(db, json.attendanceNumber, json.classNumber, json.courseID, json.shiftID,
									function (error, attendanceID) {
										if (attendanceID) {
											service.manuallyInsertStudent(db, json.ist_id, attendanceID,
												function (error) {
													if (error) {
														sendText(res, "Could not manually insert student", 500);
													} else {
														sendJSON(res, attendanceID, 200);
													}
												});
										} else {
											sendJSON(res, "Could not manually insert student for a non existing attendance", 406);
										}
									}
								);
							} else { // late
								service.getAttendanceByAttendanceAndClassNumber(db, json.attendanceNumber, json.classNumber, json.courseID, json.shiftID,
									function (error, attendanceID) {
										if (attendanceID) {
											service.manuallyInsertLateStudent(db, json.ist_id, attendanceID,
												function (error) {
													if (error) {
														sendText(res, "Could not manually insert student", 500);
													} else {
														sendJSON(res, attendanceID, 200);
													}
												});
										} else {
											sendJSON(res, "Could not manually insert student for a non existing attendance", 406);
										}
									}
								);
							}
						}
							break;
					}
				},
				function() {
					sendText(res, "Not logged in", 403);
				}
			);
			break;
		case "/api/acceptterms":
			cookies.set('acceptance', true, {httpOnly: false});
			sendText(res, "OK", 200)
			break;
		default:
			sendText(res, "File not found (POST).", 404);
			console.log("POST not found:",req.url);
			break;
	}
}

function createAttendance(db, res, ist_id, json, is_extra, studentsEnrolled) {
	var requiresAccess = (json.onlyEnrolledStudents == "true");
	service.getAttendanceRandomID(db, ist_id, json.code_type, json.code_length, json.time, json.consecutivecodes, json.courseID, is_extra, json.title, json.number, json.shift, json.attendancechecks, json.attendanceNumber, json.remote, requiresAccess, studentsEnrolled,
		function(error, randomID, attendanceID) {
			var json_res = {};
			json_res.url = config.WEBSITE_URL + "a?c=" + randomID;
			json_res.url_complete = config.WEBSITE_URL_COMPLETE + "a?c=" + randomID;
			json_res.randomID = randomID;
			(async () => {
				const url = await tinyurl(json_res.url_complete);
				json_res.tiny = url;
				sendJSON(res, json_res);
			})();
		}
	);
}


function styledTest(req, res, parsedURL) {
	var t = parsedURL.query.t;
	var n = parsedURL.query.n;

	if(t == "L" || t == "N" || t== "LN" &&
		n == 4 || n == 5 || n == 6 || n == 7 || n == 8) {
		code.customizeTest(n, t);
	}
	sendFile(res, 'client/prof.html');
}
