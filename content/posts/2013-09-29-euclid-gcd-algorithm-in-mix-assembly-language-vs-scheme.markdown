---
categories:
- algorithms
- scheme
- mixal
- mathematics
- number-theory
comments: true
date: 2013-09-29T00:00:00Z
title: Euclid's Algorithm in MIX assembly language vs Scheme
url: /blog/2013/09/29/euclid-gcd-algorithm-in-mix-assembly-language-vs-scheme/
---

I wrote my first assembly language program today, it was written in
[Donald Knuth's MIX Assembly
Language](https://en.wikipedia.org/wiki/MIX). Technically I've written
some x86 assembly in a class in 2009, but it doesn't count, it wasn't
a complete program, and I barely understood it.

It is an implementation of Euclid's Algorithm to compute the greatest common divisor of two
positive integers. Writing in an assembly language is so much more
work than writing in a high-level language like Ruby, Scheme or even
C. However, it gives a much better idea of how the computer actually
works, and gives the programmer much more appreciation for all the
nice abstractions we use in our day jobs and side projects.

The algorithm is the first example mentioned in [The Art of Computer Programming](https://en.wikipedia.org/wiki/The_Art_of_Computer_Programming). 
I found that just reading the algorithm
alone doesn't give much insight as to why it works, but reviewing a
little bit of discrete math first, one can see where the steps come
from.

First, start by assuming that m and n are positive integers, with m > 
n, and then the greatest common divisor d is the unique smallest integer such that:

{% latex %}
  $ \exists a,b \in \mathbb{Z} : am + bn = d  $
{% endlatex %}

Then, let r = m mod n (the remainder of m divided by n), we will prove
that 

{% latex %}
  $ \gcd(m,n) = \gcd(n,r) $
{% endlatex %}

All we need to show is that there are integers s and t such that 

{% latex %}
  $ sn + tr = d  $
{% endlatex %}

Note that since r = m mod n, it follows that r - m is a multiple of n,
this means: 

{% latex %}
  $ \exists k \in \mathbb{Z} \text{ such that }  r-m = kn $
{% endlatex %}

Now, we take the integers a,b in the definition of gcd(m,n) above and
add -ar to both sides of the equation:

{% latex %}
\begin{align} 
   am + bn & = d \newline
\\ am - ar + bn & = d - ar  
\\ a(m - r) + bn & = d - ar 
\\ kn + bn & = d - ar   
\\ (k + b)n & = d - ar  
\\ (k + b)n + ar & = d  
\end{align} 

{% endlatex %}

It is clear from the last equation above that s = (k+b) and t = a,
which completes the proof.

Since gcd(m,n)=gcd(n,r), and r has the property that 0 &le; r &lt; n,
we can reduce the problem to a smaller problem, and since the previous
inequality always holds, it follows that r will eventually be 0, in
which case n is the greatest common divisor.

This recursive form is very naturally captured in Scheme, 
Here's the Scheme version (problem 2.01 in SICP):
``` scheme
(define (gcd m n)
  (if (= n 0)
      m
      (gcd n (remainder m n))))
```

To implement the same algorithm in MIX assembly language, we need to
use much more primitive concepts. Firstly, we designate the X register
to hold the value of m, the I1 register to hold the value of n, and
proceed using the `DIV` operation to find the remainder. 

Here's the MIX assembly language version:

```
PRNT  EQU	19	* Typewriter terminal, stdout in MDK (GNU Mix Development Kit)
DVSR  EQU	100	* store n for DIV operation
SWAP  EQU	101	* swap to handle reg-to-reg transfers (inefficient)
START ENTA	0
      ENTX	165
      ENT1	90
E1    ST1	DVSR	* store n in DVSR
      DIV	DVSR	* rA <- m//n; rX <- m%n
E2    CMPX	=0=
      JE	QUIT	* halt if r=0, then CONTENTS(DVSOR)=gcd(m,n)
E3    STX	SWAP
      LD1	SWAP	* n <- r
      LDX	DVSR	* m <- n
      ENTA	0
      JMP	E1	* go to E1
QUIT  LDA	DVSR    * rA <- gcd(m,n)
      CHAR	0       * convert rA to character code
      STX	DVSR	* store least significant digits in DVSR cell
      OUT	DVSR(PRNT)
      HLT
      END	START
```

I came up with the above code as an exercise in in MIX Assembly
Language so that I could better understand the algorithms in the book.
I have a hunch that it is not as efficient as it could be. I do a lot of
swapping from registers to memory and back. Although to be fair, I
couldn't find a way to transfer data from a register to any of the other
registers (kind of like the [MOV instruction in x86](https://en.wikibooks.org/wiki/X86_Assembly/Data_Transfer#Move) ), 
if someone knows of a way to do this, please correct me in
the comments, I would like to know.


