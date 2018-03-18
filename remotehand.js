#!/usr/bin/env node

//*** SMARTPHONE DOORLOCK ***//

// ************* PARAMETERS *************** //
// 
// Parameters: unlockedState and lockedState
// These parameters are in microseconds.
// The servo pulse determines the degree 
// at which the horn is positioned. In our
// case, we get about 100 degrees of rotation
// from 1ms-2.2ms pulse width. You will need
// to play with these settings to get it to
// work properly with your door lock
//
// Parameters: motorPin
// The GPIO pin the signal wire on your servo
// is connected to
//
// Parameter: blynkToken
// The token which was generated for your blynk
// project
//
// **************************************** //

const Raspi = require('raspi-io');
const five = require('johnny-five');
const board = new five.Board({
	io: new Raspi()
});

//var five = require("johnny-five");
//var five = require("../lib/johnny-five.js");

var keypress = require('keypress');

keypress(process.stdin);

var motorPin = 18;

//Simple math to calculate the rotation pulse width
var unlockedState = 889  //889
var lockedState = 1956  //1956

var blynkToken = '2ea9d34e68ef4c8286f316cdc6f2da1b';

// *** Start code *** //

board.on("ready", function() {

var servo = new five.Servo.Continuous('P1-12');  // servo only support on 2 to 12

process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.setRawMode(true);

process.stdin.on("keypress", function(ch, key){
	if (key.name === "q") {
	servo.cw();}
});

var locked = true;

//var signalpin = new five.Pin('P1-12');


//Setup servo
var Gpio = require('pigpio').Gpio,
motor = new Gpio(motorPin, {mode: Gpio.OUTPUT});

//Setup blynk
var Blynk = require('blynk-library');
var blynk = new Blynk.Blynk(blynkToken);
var v0 = new blynk.VirtualPin(0);
var v1 = new blynk.VirtualPin(1);  // add this button to stop servo gear

console.log("locking door")
lockDoor()

v0.on('write', function(param) {
	console.log('V0:', param);
  	if (param[0] === '0') { //unlocked
  		servo.cw();
		unlockDoor();
  	} else if (param[0] === '1') { //locked
  		servo.ccw();
		lockDoor();
  	} else {
  		blynk.notify("Door lock button was pressed with unknown parameter");
  	}
});

v1.on('write', function(pm) {
	console.log('V1:', pm);
	if (pm[0] === '1') {
		servo.cw(0.05);
		setTimeout(function(){servo.stop()}, 1500);
	}
	else if (pm[0] === '0') {
		servo.ccw(0.05);
		setTimeout(function(){servo.stop()}, 1500);
	}

}
);

blynk.on('connect', function() { console.log("Blynk ready."); });
blynk.on('disconnect', function() { console.log("DISCONNECT"); });


process.stdin.on("keypress", function(ch, key) {

    if (!key) {
      return;
    }

    if (key.name === "q") {
      console.log("Quitting");
      process.exit();
    } else if (key.name === "up") {
      console.log("CW");
      servo.cw(0.05);
      setTimeout(function(){servo.stop()}, 1500);
    } else if (key.name === "down") {
      console.log("CCW");
      servo.ccw(0.05);
      setTimeout(function(){servo.stop()}, 1500);
    } else if (key.name === "space") {
      console.log("Stopping");
      servo.stop();
    }
  });

function lockDoor() {
	motor.servoWrite(lockedState);
	locked = true

	//notify
  	blynk.notify("Door has been locked!");
  	
  	//After 1.5 seconds, the door lock servo turns off to avoid stall current
  	setTimeout(function(){motor.servoWrite(0)}, 1500)
}

function unlockDoor() {
	motor.servoWrite(unlockedState);
	locked = false

	//notify
  	blynk.notify("Door has been unlocked!"); 

  	//After 1.5 seconds, the door lock servo turns off to avoid stall current
  	setTimeout(function(){motor.servoWrite(0)}, 1500)
};

});
