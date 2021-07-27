module.exports = {
	requestAccessToken: requestAccessToken,
	getUserInfo: getUserInfo,
	getCourseInfo: getCourseInfo,
	requestCourseShift: requestCourseShift,
	requestStudentsEnrolled: requestStudentsEnrolled,
	requestDegrees: requestDegrees,
	requestCoursesFromDegree: requestCoursesFromDegree,
};

var request = require('request');
var config = require('./default_config');
var moment = require('moment');

function requestAccessToken(fenix_code, callback){
	request.post(
		'https://fenix.tecnico.ulisboa.pt/oauth/access_token?' +
		'client_id=' + encodeURIComponent(config.client_id) +
		'&client_secret=' + encodeURIComponent(config.client_secret) +
		'&redirect_uri=' + encodeURIComponent(config.WEBSITE_REDIRECT) +
		'&code=' + encodeURIComponent(fenix_code) +
		'&grant_type=authorization_code',
		{ json: {key: ' '}},

			function (error, response, body) {
				if(!error && response.statusCode == 200) {
					callback(error, body.access_token, body.refresh_token);
				} else { //TODO handle this better
					callback(error);
					console.log('Erro no requestAccessToken().', response.statusCode, error);
				}
			}
		);

}

function getUserInfo(access_token, refresh_token, callback) {
	request
		({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person?access_token=' + encodeURIComponent(access_token), json: true}
			, function(error, response, body) {
				if(response.statusCode == 200) {
					callback(error, body, isProfessor(body));
				} else if(response.statusCode == 401 && body
					&& body.error && body.error == 'accessTokenExpired') {
						console.log('Error - getUserInfo: Requires new access token.');

				} else if(body){ 
					console.log('Erro no getUserInfo()', response.statusCode, body);
					callback(body.error);
				} else { 
					console.log('Erro no request do getUserInfo().', response.statusCode, error);
					callback(error);
				}
			});
}

function isProfessor(body){
	for(var i = 0; i < body.roles.length; i++) {
		if(body.roles[i].type == 'TEACHER'){
			return true;
		}
	}
	return false;
}

function getCourseInfo(access_token, refresh_token, callback){
	request
		({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/person/courses?access_token=' + encodeURIComponent(access_token), json: true}
			, function(error, response, body) {
				if(response.statusCode == 200) {
					callback(error, body);
				} else if(response.statusCode == 401 && body
					&& body.error && body.error == 'accessTokenExpired') {
						console.log('Error - getUserInfo: Requires new access token.');
				} else {
					console.log('Erro no getCourseInfo.', response.statusCode, error);
					callback(error);
				}
			});
}


function refreshAccessToken(refresh_token, callback){
	request.post(
		'https://fenix.tecnico.ulisboa.pt/oauth/refresh_token?' +
		'client_id=' + encodeURIComponent(config.client_id) +
		'&client_secret=' + encodeURIComponent(config.client_secret) +
		'&refresh_token=' + encodeURIComponent(refresh_token) +
		'&grant_type=refresh_token',
		{ json: {key: ' '}},

			function (error, response, body) {
				if(!error && response.statusCode == 200) {
					callback(error, body.access_token);
				} else { //TODO handle this better
					callback(error);
					console.log('Erro no refreshAccessToken().', response.statusCode, error, body);
				}
			}
		);

}

function requestStudentsEnrolled(fenix_id, callback) {
	request
		({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/' + fenix_id + "/students", json: true}
			, function(error, response, body) {
				if(response.statusCode == 200) {
					callback(error, body);
				} else if(response.statusCode == 401 && body
					&& body.error && body.error == 'accessTokenExpired') {
						console.log('Error - getUserInfo: Requires new access token.');
				} else {
					console.log('Erro no requestStudentsEnrolled.', response.statusCode, error);
					callback(error);
				}
			});
}

function requestCourseShift(fenix_id, callback) {
	request
		({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/' + encodeURIComponent(fenix_id) + '/schedule'
			, json: true}
			, function(error, response, body) {
				if(!error && response.statusCode == 200) {
					callback(error, body);
				} else {
					callback(error);
					console.log('Error no requestCourseShift().', response.statusCode, error, body);
				}
			});
}

/* ------------- */
function requestDegrees(academic_year, callback) { // eg https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=2020/2021
	request
	({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees?academicTerm=' + encodeURIComponent(academic_year), json: true},
		function(error, response, body) {
			if(!error && response.statusCode === 200) {
				let new_body = []
				let aux_body = {}
				for (let i = 0; i< body.length; ++i){
					aux_body['id'] = body[i]['id']
					aux_body['name'] = body[i]['name']
					aux_body['acronym'] = body[i]['acronym']
					new_body.push(aux_body);
					aux_body = {}
				}

				new_body.sort(function (a, b) {
					return a.acronym.localeCompare(b.acronym);
				});

				callback(error, new_body);
			} else {
				callback(error);
				console.log('Error no requestDegrees().', response.statusCode, error, body);
			}
		}
	);
}

function requestCoursesFromDegree(degree, academic_year, callback) { // eg https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/2761663971585/courses?academicTerm=2020/2021
	request
	({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/degrees/' + encodeURIComponent(degree) + '/courses?academicTerm=' + encodeURIComponent(academic_year), json: true},
		function(error, response, body) {
			if(!error && response.statusCode === 200) {
				let new_body = []
				let aux_body = {}
				for (let i = 0; i< body.length; ++i){
					aux_body['id'] = body[i]['id']
					aux_body['name'] = body[i]['name']
					aux_body['acronym'] = body[i]['acronym']
					aux_body['academicTerm'] = body[i]['academicTerm']
					new_body.push(aux_body);
					aux_body = {}
				}

				new_body.sort(function (a, b) {
					return a.acronym.localeCompare(b.acronym);
				});

				callback(error, new_body);
			} else {
				callback(error);
				console.log('Error no requestCoursesFromDegree().', response.statusCode, error, body);
			}
		}
	);
}

function requestStudentsFromCourse(course, callback) { // eg https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/1127510519584787/students
	request
	({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/' + encodeURIComponent(course) + '/students', json: true},
		function(error, response, body) {
			if(!error && response.statusCode === 200) {
				callback(error, body);
			} else {
				callback(error);
				console.log('Error no requestStudentsFromCourse().', response.statusCode, error, body);
			}
		}
	);
}

function requestScheduleFromCourse(course, callback) { // eg https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/1127510519584787/students
	request
	({url:'https://fenix.tecnico.ulisboa.pt/api/fenix/v1/courses/' + encodeURIComponent(course) + '/schedule', json: true},
		function(error, response, body) {
			if(!error && response.statusCode === 200) {
				callback(error, body);
			} else {
				callback(error);
				console.log('Error no requestScheduleFromCourse().', response.statusCode, error, body);
			}
		}
	);
}