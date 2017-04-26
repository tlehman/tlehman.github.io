---
categories:
- programming
- C
- unix
comments: true
date: 2013-11-25T00:00:00Z
title: Bootstrapping most of a C dev environment
url: /blog/2013/11/25/bootstrapping-most-of-a-c-dev-environment/
---

I've taken a break from SICP and TAOCP in order to get a good foundation in the [C programming language](http://c2.com/cgi/wiki?CeeLanguage), I'm familiar with it, but that is not good enough. The reason is because C exposes a lot more about how the computer works, understanding it is an important first step in understanding computers. Steve Yegge said it well:

> You just have to know C. Why? Because for all practical purposes, every computer in the world you'll ever use is a von Neumann machine, and C is a lightweight, expressive syntax for the von Neumann machine's capabilities.

The SICP world-view is from a parallel world of computing that grew from John McCarthy's LISP. There were even alternatives to the von Neumann architecture (Lisp Machines) that were built, which natively ran Lisp.

In the interest of [grokking](http://c2.com/cgi/wiki?ToGrok) computers (not just knowing how to put them together, configure and run scripts on them), I should really know C.

I've started with the basic command line tools:

 - `cat(1)`
 - `grep(1)`
 - `ls(1)`
 - `wc(1)`

Note: `foo(n)` means that the command `foo` is on manpage section `n`, to view the manpage, type `man n foo`.

For `cat(1)`, it was a simple matter of using `read(2)` and `write(2)`, the only tricky thing is getting familiar with IO buffering, but other than that it's trivial. After having written these tools, I've been using them to work on this code, so I would use my own `cat` and my own `grep` and `wc` inspect the code I had just written, it was very rewarding.

From there I decided I should go further and write an editor, I researched to find the simplest editor that was common on Unix-like systems. I didn't have to look far to find [ed](http://c2.com/cgi/wiki?EdIsTheStandardTextEditor), it is a line-based editor, and after spending 30 minutes learning how to use it, I found the commands similar vi or vim, except that I had to imagine the text, I couldn't see it as I typed. Then I'll need a shell, then a C compiler, then an operating system.

I can probably handle a shell, but I'll need to study a lot more before I put together a compiler and operating system.

My long term goal is to be able to write a whole develpment environment from scratch. Since Unix-like systems are built from small pieces, it makes it reasonably feasible to do it piece by piece.

