---
categories:
- bash
- command-line
- unix
- manpages
- lesson
comments: true
date: 2013-01-28T00:00:00Z
title: 'Reinventing the wheel: Or how I learned to stop coding and read the manpages'
url: /2013/01/28/reinventing-the-wheel-or-how-i-learned-to-stop-coding-and-read-the-manpages/
---

About a month ago I [wrote about a command line utility](/blog/2012/12/30/building-command-line-utilities-in-ruby-that-play-well-with-the-rest-of-the-unix-utilities/) I made that calculates word and character frequencies. It was packaged as a ruby gem and it interacted well with the Unix pipeline interface.

Then, about 2 or 3 weeks later, I come across this post on Twitter:

<blockquote class="twitter-tweet"><p>Show how many times each line in a sorted file is repeated: uniq -c</p>&mdash; Unix tool tip (@UnixToolTip) <a href="https://twitter.com/UnixToolTip/status/292295351518498816">January 18, 2013</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

And I realized that I could construct a one-liner that does what my gem did. Probably faster too. I know about uniq and sort, and I've used awk a little bit, but am not really familiar with most of it's capabilities.

The two features I implemented in ruby were (1) counting word frequencies and (2) counting character frequencies. I defaulted everything to lower case and stripped out non-alphanumeric characters.

Using @UnixToolTip's suggestion of `uniq -c`, I came up with this alternative: 

``` bash
for word in $(cat filename); do echo $word; done | sed 's/[^a-zA-Z0-9]//g' | tr '[A-Z]' '[a-z]' | sort | uniq -c | sort -nr | head
```

This just outputs the file, splits everything up by whitespace, strips out anything that isn't alphanumeric, then lowercases, sorts, and counts the number of repetitions using `uniq -c`. The result of that is then sorted numerically, to get the most frequent items at the top of the output, and then displays just the top 10 lines using `head`. There are some small numerical differences between this and my gem, and that is most likely because I split by word boundary in ruby, but split by whitespace on the bash one-liner.

For the problem I was trying to solve, I could have saved some time by digging through the manpages instead of writing another gem. I did enjoy working with the Rubygems packaging system, but I am starting to think that was overkill.

NOTE: For the character count feature, all I have to do is output one character per line, then I can insert that into the pipeline to get the desired output: 

``` bash
(CONTENTS OF FILENAME, 1 CHARACTER PER LINE) | sed 's/[^a-zA-Z0-9]//g' | tr '[A-Z]' '[a-z]' | sort | uniq -c | sort -nr | head
```

I'm not sure how to do this at the moment, I think `awk` can do it pretty simply, I'll read the manpages, but for now I have to get to work.

