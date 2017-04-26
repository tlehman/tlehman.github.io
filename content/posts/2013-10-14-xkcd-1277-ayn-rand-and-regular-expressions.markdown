---
categories:
- humor
- regex
- xkcd
- command-line
comments: true
date: 2013-10-14T00:00:00Z
title: 'XKCD 1277: Ayn Rand and Regular Expressions'
url: /blog/2013/10/14/xkcd-1277-ayn-rand-and-regular-expressions/
---

Randall Munroe of XKCD is brilliant, today's comic is no exception:

{%img http://imgs.xkcd.com/comics/ayn_random.png %}

While the Ayn Rand joke is amusing, the real clever joke in the alt text (that maddeningly disappears if you take too long to read)

> In a cavern deep below the Earth, Ayn Rand, Paul Ryan, Rand Paul, Ann Druyan, Paul Rudd, Alan Alda, and Duran Duran meet togther in the Secret Council of /(\b[plurandy]+\b ?){2}/i

For those not familiar with regular expressions, the end of that sentence might look like nonsense, but it encodes the (much more amusing) similarity between all those names:

Let's start with the list of names, assume they are in a file called `names`

``` bash
$ cat names
Ayn Rand
Paul Ryan
Rand Paul
Ann Druyan
Paul Rudd
Alan Alda
Duran Duran
```

For each of the names, set them to lower case, split up the characters, then sort and count occurences: 

``` bash
cat names | xargs ruby -e 'puts ARGV.join.downcase.split(//)' | sort | uniq -c
     15 a
      8 d
      5 l
     10 n
      3 p
      7 r
      7 u
      3 y
```

Notice that there are only 8 unique characters in that list, in [regular expressions](http://en.wikipedia.org/wiki/Regular_expression) the syntax `[plurandy]` means 'match any character in the set `{p,l,u,r,a,n,d,y}`'

You can see in this diagram how the whole expression works:

{% img https://www.debuggex.com/i/CzkCTSvo1uBAYkyi.png %}

``` perl
/(\b[plurandy]+\b ?){2}/i
```

The character `\b` matches a word boundary, which is a point between a word character and a non-word character, such as the point right before the beginning of the name, or after. The trailing `/i` means case insensitive, the diagram explains the rest.

_The above graphic is done in [Debuggex](https://www.debuggex.com/r/CzkCTSvo1uBAYkyi), it is a fantastic tool for exploring and debugging regular expressions_
