---
categories:
- bash
- command-line
- statistics
comments: true
date: 2013-06-18T00:00:00Z
title: Analyzing Bash History and Fixing Typos
url: /2013/06/18/analyzing-bash-history-and-fixing-typos/
---

At the command line, I frequently type things too fast, and typos abound. A single character can mean the difference between showing documentation and deleting files (`rm` vs `ri`), so autocorrect is definitely a bad idea in this context.

Instead of a generic autocorrect, a better idea is to find the most common mistakes. To do so, I used frequency analysis like in [this post](/blog/2013/01/28/reinventing-the-wheel-or-how-i-learned-to-stop-coding-and-read-the-manpages/) to narrow down what I use most at the shell:

``` bash
$ cat ~/.bash_history | 
     awk -F\| '{print $1}' | 
     sort | 
     uniq -c | 
     sort -n | 
     tail -15

 157 rake routes
 221 dbtt
 232 git fetch -p
 300 rails c
 370 gi ts
 376 g gs
 403 git add .
 405 rails s
 406 git b
 433 exit
 435 git lg
 663 git diff
1112 ls
1898 clear
4486 git s
```

Notice that `gi ts` is extremely common, I meant to type `git s` all those 376 times. As a solution, I could just alias it, but I would prefer a more general solution that would handle `gi tdiff` and `gi tb` as `git diff` and `git b` respectively.

I made the following script called `~/bin/gi`:

``` bash
#!/bin/sh

if   [[ $1 =~ 'ts' ]]; then
  git s
elif [[ $1 =~ 'tb' ]]; then
  git b 
elif [[ $1 =~ 'tdiff' ]]; then
  git diff
fi
```

So that `gi ts` is no longer a mistake, it means what I meant it to mean. This saves me a few keystrokes, and it is a good example of why scripts in your path are generally better than aliases, since you can have logic in them.
