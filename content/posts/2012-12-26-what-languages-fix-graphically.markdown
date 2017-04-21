---
categories:
- data-visualization
- graph
- programming
comments: true
date: 2012-12-26T00:00:00Z
title: 'What languages fix: graphically'
url: /2012/12/26/what-languages-fix-graphically/
---

Paul Graham's article [What languages fix](http://www.paulgraham.com/fix.html) is about Kevin Kelleher's description of each programming language in terms of the problems with other languages that it fixes. I decided to make this into a graph where each node is a language, and the edge represents the relation "x fixes y".

Here is the list:

 - Algol: Assembly language is too low-level.
 - Pascal: Algol doesn't have enough data types.
 - Modula: Pascal is too wimpy for systems programming.
 - Simula: Algol isn't good enough at simulations.
 - Smalltalk: Not everything in Simula is an object.
 - Fortran: Assembly language is too low-level.
 - Cobol: Fortran is scary.
 - PL/1: Fortran doesn't have enough data types.
 - Ada: Every existing language is missing something.
 - Basic: Fortran is scary.
 - APL: Fortran isn't good enough at manipulating arrays.
 - J: APL requires its own character set.
 - C: Assemby language is too low-level.
 - C++: C is too low-level.
 - Java: C++ is a kludge. And Microsoft is going to crush us.
 - C#: Java is controlled by Sun.
 - Lisp: Turing Machines are an awkward way to describe computation.
 - Scheme: MacLisp is a kludge.
 - T: Scheme has no libraries.
 - Common Lisp: There are too many dialects of Lisp.
 - Dylan: Scheme has no libraries, and Lisp syntax is scary.
 - Perl: Shell scripts/awk/sed are not enough like programming languages.
 - Python: Perl is a kludge.
 - Ruby: Perl is a kludge, and Lisp syntax is scary.
 - Prolog: Programming is not enough like logic.

I put the above text into a file called 'fix.txt' and then wrote the following ruby code to convert it into a directed graph in the DOT language:

``` ruby
# make a graph of language solutions (inspired by: http://www.paulgraham.com/fix.html)

fixes = File.open('fix.txt').read.split("\n")

fixes.each do |fix|
  language = fix.split(":").first
  /\:(?<fixed>.*)\b(is(n't)?|are|doesn't)\b/ =~ fix
  puts "#{language} -> #{fixed} [label=\"fixes\"]"
end
```

I had to tweak the output a bit, but the final result is a very nice summation of Kelleher's list:
<a href="/images/blogimg/lang_fixes.png"><img src="/images/blogimg/lang_fixes.png"></a>
