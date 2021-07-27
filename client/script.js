var distance;
var x = null;
var INTERVAL = 7*1000;
var repetitions = 5; 
var code_counter = 1;

function randomCode() {
	var text = "";
	var possible_all = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	for (var i = 0; i < 7; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

var timer_function = function() {
	if(distance == INTERVAL) {
		document.getElementById("code_counter").innerHTML = "Code number " + code_counter;
		code_counter++;
		document.getElementById("randomcode").innerHTML = randomCode();
	}

	var seconds = Math.floor((distance % (1000 * 60)) / 1000);
	distance = distance - 1*1000;
	document.getElementById("timer").innerHTML = seconds + "s ";

	if (distance < 0) {
		clearInterval(x);
		x = null;
		document.getElementById("timer").innerHTML = "EXPIRED";
		document.getElementById("randomcode").innerHTML = "";
		
		if(repetitions-- > 1) {
			startCountdown();
		}
		else {
			document.getElementById("code_counter").innerHTML = "";
			
		}
	}
};

function startCountdown() {

	distance = INTERVAL;

	if(x != null) {
		clearInterval(x);
	}

	x = setInterval(timer_function, 1000);
}

function startProcess() {
	repetitions = 5; 
	code_counter = 1;

	startCountdown();

}