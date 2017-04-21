---
categories:
- unix
- time
comments: true
date: 2012-12-20T00:00:00Z
title: Unix end of times
url: /2012/12/20/unix-end-of-times/
---

A lot of people feared the year 2000 because the two digit year date rolled over from 99 to 00, which was believed to cause a lot of problems with time-dependent computer systems.

Now (December 20, 2012), a few people fear the year 2012 because on December 21, the Mayan calendar rolls over from 12.19.19.19.19 to 13.0.0.0.0

However, no one uses the Mayan calendar, so it's silly to think it would have any impact. A much more plausible year to fear is 2038, because the majority of computers running the world are using Unix time, which is a 32-bit integer value that records the number of seconds that have passed since January 1, 1970. Since times before 1970 are negative, the integer value is signed, so only 31 bits are left to count time in the forward direction.

So, 2<sup>31</sup>-1 = 2,147,483,647 is the total number of seconds, or about 68 years, after that, the integer value will overflow and anything the computer is doing that depends on the monotonicity of time (that all times increase in value), will be invalid. This probably won't be an issue, since it is easy to increase the data type so that time can increase without bound for much longer.

The title of this is misleading, there will be no apocolypse, the standard will be updated and life will go on, just like it always does.