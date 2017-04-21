---
categories:
- abstract-algebra
- scheme
- mathematics
comments: true
date: 2013-09-07T00:00:00Z
title: Monoids in Scheme
url: /2013/09/07/monoids-in-scheme/
---

There is a structure in abstract algebra called a monoid. There are several ways to define a monoid, but before we start, we should answer the obvious question: *why should you care?*

The reason being aware of monoids is important is that they are everywhere, and knowing the properties of general monoids will lead to better understanding of their specific manifestations, such as the accumulator pattern or string concatenation. I'll give a good example to start out with: linked lists.

<img src="/images/blogimg/list.png">

For the sake of simplicity, I am going to use scheme lists and the `append` operation. In [Section 2.2 of SICP](https://mitpress.mit.edu/sicp/full-text/sicp/book/node32.html), the closure property of was defined. _This is distinct from the notion of [closure](http://stackoverflow.com/a/36639/46871) of an expression over the surrounding environment_.

An operation `#` is said to be 'closed' in the sense that given two values `A` and `B` of the same type, the expression `A # B` is a value of the same type. In scheme-like prefix notation, we would write `(# A B)`.

Given a list `A` and a list `B`, we can concatenate the two lists and get a new list, `(append A B)`

``` scheme
(append (append '(a) '(b)) '(c))
; => (a b c)
```

Another way to construct it is:
``` scheme
(append '(a) (append '(b) '(c)))
; => (a b c)
```

The fact that `(a b c)` can be constructed in either way means that `append` is an associative operation, and readers of this blog should recognize that [`fold-left` and `fold-right` would give the same result in this case](/blog/2013/09/02/quasiquoting-in-scheme-to-study-a-computation/).

## Set-theoretic Definition of a monoid
This leads to the first two properties that define a general monoid, a monoid is:


{% latex %}
$ \text{a set } M \text{ with an associative operation } *:M \times M \to M $ 
{% endlatex %}

Note: the closure property is implicit in the defintion of the operation as a function, since it is impossible for the output of the function to be anything outside of M.

The set M has an identity element e in M, it is defined by:

{% latex %}
$ \forall m \in M : e*m = m*e = m $
{% endlatex %}

<hr>

From the three properties that define of monoids (closure, associativity, identity), we can prove the uniqueness of the identity element:

Suppose `a` and `b` are identity elements, then:

{% latex %}

$ a*b=b*a=b $

$ b*a=a*b=a $

$ a = b $

{% endlatex %}

This applies to all monoids, in our example, the set `M` is the set of all Scheme lists, the operation is `append`, and the unique identity element is the empty list.

### Further Reading
 - Dan Piponi (SIGFPE) wrote [a lot of good stuff about monoids in haskell](http://blog.sigfpe.com/2009/01/haskell-monoids-and-their-uses.html) at his blog 'A Neighborhood of Infinity
 - Pete Clark wrote [a good introduction to semigroups and monoids](http://math.uga.edu/~pete/semigroup.pdf) on his UGA website
