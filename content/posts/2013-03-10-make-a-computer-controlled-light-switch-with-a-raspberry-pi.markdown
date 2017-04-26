---
categories:
- diy
- make
- programming
- python
- raspberrypi
comments: true
date: 2013-03-10T00:00:00Z
title: Make a computer-controlled light switch with a Raspberry Pi
url: /blog/2013/03/10/make-a-computer-controlled-light-switch-with-a-raspberry-pi/
---

To build a computer-controlled light switch, you will need:

 - [Raspberry Pi](http://www.raspberrypi.org/) ($35)
 - [Adafruit Powerswitch Tail 2](http://www.adafruit.com/products/268) ($25)

The powerswitch tail looks like an extension cord with some holes in it to wire it into your own circuit. Connect the powerswitch to the raspberry pi as in the image below (on is connected to pin 23):

{% img /images/blogimg/rasbpi_adafruit.jpg %}

Then, the following python program will allow you to type `./switch on` or `./switch off` from the command line as root.

``` python
#!/usr/bin/env python
# Turn switch on/off
# by tlehman

import RPi.GPIO as io
import sys

io.setmode(io.BCM)
pin = 23
io.setwarnings(False)
io.setup(pin, io.OUT)                 # set pin 23 as output

if len(sys.argv) > 1:
    state = sys.argv[1]               # get command line argument ('on' or 'off')
    io.output(pin, state == 'on')     # if state is on, let pin 23 connect the circuit, otherwise break the circuit
else:
    print("Usage: ")
    print("  ./switch (on|off)")
```

To run this, carefully plug in a lamp (or other appliance that uses a standard 120V U.S. outlet), then 

``` bash
sudo su
./switch on
./switch off
```

Here is a video of the light being switched off and then back on, not very exciting, but it works: 

<iframe width="560" height="315" src="http://www.youtube.com/embed/IO_BZ0mRYyQ" frameborder="0" allowfullscreen></iframe>

This on it's own is not very useful or amusing, but this can easily be tied together with any API or command line utility. For example, I plan to connect this to our continuous integration server at work so that every time the tests fail, the switch turns some lights off, this could be achieved with a cron job, or perhaps a hook on Jenkins that sends a signal to the raspberry pi, there are so many possbilities.

