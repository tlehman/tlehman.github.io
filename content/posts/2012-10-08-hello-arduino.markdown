---
categories:
- make
- arduino
comments: true
date: 2012-10-08T00:00:00Z
title: Hello Arduino
url: /blog/2012/10/08/hello-arduino/
---

I have heard of Arduino and physical computing platforms before but have never really played with them. As preparation for building a robot, I wanted to get a feel for microcontrollers.

The "Hello World" of Arduino projects is getting an LED to blink, that part was easy. I wanted a bit of user input, so I got a little switch and wired it up. Here is a sample, it's just a button that turns a light on and off. I made it so that the light would stay on until you pressed the button again.


<iframe width="420" height="315" src="http://www.youtube.com/embed/IeztYjunHQQ" frameborder="0" allowfullscreen></iframe>


A good friend of mine turned me on to [SparkFun](www.sparkfun.com), It is a fantastic source for hobby electronics, very accessible. I got a claw that will be part of the robot, and controlling it isn't too hard either, the Arduino IDE even provide sample source code to start out:


``` c++
// Sweep
// by BARRAGAN <http://barraganstudio.com> 
// This example code is in the public domain.


#include <Servo.h> 
 
Servo myservo;  // create servo object to control a servo 
                // a maximum of eight servo objects can be created 
 
int pos = 0;    // variable to store the servo position 
 
void setup() 
{ 
  myservo.attach(9);  // attaches the servo on pin 9 to the servo object 
} 
 
 
void loop() 
{ 
  for(pos = 0; pos < 180; pos += 1)  // goes from 0 degrees to 180 degrees 
  {                                  // in steps of 1 degree 
    myservo.write(pos);              // tell servo to go to position in variable 'pos' 
    delay(15);                       // waits 15ms for the servo to reach the position 
  } 
  for(pos = 180; pos>=1; pos-=1)     // goes from 180 degrees to 0 degrees 
  {                                
    myservo.write(pos);              // tell servo to go to position in variable 'pos' 
    delay(15);                       // waits 15ms for the servo to reach the position 
  } 
} 
```

After attaching the servo to the claw and wiring it up, the above code opens and closes the claw: 
<iframe width="420" height="315" src="http://www.youtube.com/embed/ov1YXQ9U0W4" frameborder="0" allowfullscreen></iframe>


Next, I wanted to give continuous input, so I got a [potentiometer](http://en.wikipedia.org/wiki/Voltage_divider#Applications) from SparkFun. Using [pulse-width modulation](http://en.wikipedia.org/wiki/Pulse-width_modulation), an LED can be dimmed to an arbitrary degree, so I can use an LED to reflect the value that the Arduino is reading from the potentiometer. This would be a dimmer switch, the code was pretty simple, I've posted it after the video of the dimmer switch in action: 


<iframe width="420" height="315" src="http://www.youtube.com/embed/FK0bt_S8Ajo" frameborder="0" allowfullscreen></iframe>


Here is my source code for the dimmer switch, the setup routine just tells the 13th digital pin to be an output and the 7th digital pin to read input. The 13th pin was chosen for LED output for convenience, since the ground pin is right next to it, I could just plug the LED directly into the two close-by pins.


```c++
// blink a few LEDs
const int LED = 13;
const int BUTTON = 7;

int val = 0;    // store the state of the input pin
int old_val = 0; // store the previous input state
int state = 0;  // 0 = LED off, 1 = LED ON

void setup()
{
  pinMode(LED, OUTPUT);
  pinMode(BUTTON, INPUT);
}

void loop()
{
  val = digitalRead(BUTTON);                  // get the potentiometer value
  
  if((val == HIGH) && (old_val == LOW)) {     // if light is on and was just off a moment ago
    state = 1 - state;                        // change state
    delay(10);                                // wait 10 miliseconds
  }
  
  old_val = val;                              // store old potentiometer value
  
  if(state == 1) {
    digitalWrite(LED, HIGH);                  // turn LED on
  } else {
    digitalWrite(LED, LOW);                   // turn LED off
  }
}
```
