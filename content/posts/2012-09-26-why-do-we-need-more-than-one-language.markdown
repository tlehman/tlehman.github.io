---
categories:
- programming
- opinion
- code
comments: true
date: 2012-09-26T00:00:00Z
title: Why do we need more than one language?
url: /2012/09/26/why-do-we-need-more-than-one-language/
---

My dad asked me an interesting question recently, *why do we need more than one programming language?*. I gave a short answer: *we don't*.

And a long answer to a related question, *why are there so many programming languages?*

We have them anyway for a number of reasons: 

- Aesthetics (some people don't like semicolons, case sensitivity, etc. (Lousy reason at face value, but I must say, reading code written in Ruby is usually much easier than reading code written in C++).
- Specialization vs. Generalization is an eternal struggle
  - SQL is very useful as it is focused on querying data, but it is too specialized to do anything like make a website or firmware for a phone.
  - Lisp and Java are general purpose enough that you can do anything with them, but querying data using Java or Lisp is more work, since you have to set up the database connection and implement how the data is queried. In SQL, you just write the query and the database figures out the implementation details.
- The *why not?* factor.
  - Case in point: [Brainfuck](http://www.muppetlabs.com/~breadbox/bf/)
- The Esperanto factor
  - Languages grow and adapt, and after a while, it gets out of control. Sometimes, people get together armed with decades of experience and skill and endeavor to create a language that makes coding easier, safer, and more fun.
    - Case in point: [Go](http://golang.org/) (some veteran C/C++/Java programmers at Google got together to create a new language that fixed some of the problems of the old languages, for example, when you create an array of integers in Go, all of them are set to zero initially, whereas in C++, the array is full of whatever happened to be in that memory last (garbage data)).
- The Empire factor
  - Apple doesn't let you write Java on an iPhone, why? Because fuck you, we are Apple,  and we say you have to write Objective-C.
  - Microsoft doesn't let you write Java on the Windows phone, because they made C# which is totally not a direct copy of Java in every meaningful way. Totally not.
- Features and Abstraction
  - C can do everything, but C++ was invented to make data and procedural abstraction more convenient.
  - Java was invented to be a C++ replacement, where you didn't have to manage your own memory.
  - Lisp can do everything and it is a beautiful Platonic ideal. But, like set theory, when you have to get work done and you have a deadline, in an environment where you have little room to experiment, it's more useful to use shortcuts and take pre-packaged libraries and frameworks and languages that happen to have those libraries and frameworks available.
  - Perl, Python and Ruby all simplified a lot of the tasks that you could otherwise do in the other languages. This is due to the simpler syntax, lack of compile time, and ease of creating abstractions.

Overall, I think that the reasons we have so many languages are understandable. As nice as it would be to have a standard language, no language has arisen yet that would solve all the problems that software developers face, and even if it did, people would still make alternatives for reasons other than practicality. 
