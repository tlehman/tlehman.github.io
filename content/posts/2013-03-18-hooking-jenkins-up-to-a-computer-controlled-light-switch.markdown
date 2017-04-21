---
categories:
- programming
- make
- raspberrypi
comments: true
date: 2013-03-18T00:00:00Z
title: Hooking Jenkins up to a computer-controlled light switch
url: /2013/03/18/hooking-jenkins-up-to-a-computer-controlled-light-switch/
---

About a week ago I [wrote about how to hook up a light switch to a raspberry pi](/blog/2013/03/10/make-a-computer-controlled-light-switch-with-a-raspberry-pi/). Having a computer-controlled light switch is nice, but the novelty wears off pretty quickly. The next question that arises usually is _how can I make this useful?_

At work, our continuous integration server, which runs [Jenkins](http://jenkins-ci.org/), lets us know when one of the team members has broken the build. To make sure that we get the memo promptly so we can commence with the public shaming, we use tools that change color to indicate the current test status.

The problem with our current way of doing things is that there is no sound, and it requires that someone be at their computer. To remedy this situation, we wired up physical lights to a raspberry pi running a Debian GNU/Linux variant, and wrote this script to toggle the lights.
                                                                              
 - On means Passing  (all jobs passed)
 - Off means Failing (at least one job failed)
                                                                              
The data flows from Jenkins to the Raspberry-Pi as follows:



<div style="width:300px;margin:auto">
{% img /images/blogimg/tds.png %}
</div>



gpio stands for (General Purpose Input/Output), the utility is part of the [wiringPi](https://projects.drogon.net/raspberry-pi/wiringpi/) package 
                                                                              
                                                                              
NOTE: You need to set the following environment variables:

  - `JENKINS_USERNAME`

  - `JENKINS_PASSWORD`

  - `JENKINS_HOSTNAME`
      
                                                                              
Dependencies:

   - [Ruby](http://ruby-lang.org)

   - [wiringPi](https://projects.drogon.net/raspberry-pi/wiringpi/)
                                                                              
```bash
curl --user $JENKINS_USERNAME:$JENKINS_PASSWORD $JENKINS_HOSTNAME/api/json 2> /dev/null                      |   # (Jenkins Job Statuses)

ruby -rjson -e 'puts (JSON.parse(STDIN.read)["jobs"].map{|j| j["color"]}.all?{|c| c=="blue"} ? "up":"down")' |   # (JSON parser/extractor) 

while read line; do   gpio write 4 $line;     done                                                               # (gpio utility)
```


This script runs on the raspberry pi itself.
