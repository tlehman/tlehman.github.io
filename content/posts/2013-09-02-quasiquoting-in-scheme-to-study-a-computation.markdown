---
categories:
- scheme
- sicp
comments: true
date: 2013-09-02T00:00:00Z
title: Quasiquoting in Scheme to study a computation
url: /2013/09/02/quasiquoting-in-scheme-to-study-a-computation/
---

While working though [Structure and Interpretation of Computer Programs](https://mitpress.mit.edu/sicp/), I came across the definition of the `fold-right` function:

> Exercise 2.38: The accumulate procedure is also known as fold-right,
> because it combines the first element of the sequence with the
> result of comining all the elements to the right. 

I have trouble with purely verbal explanations of things, I prefer notation and diagrams whenever appropriate. In exercise 2.38, the authors give a definition of `fold-left` in Scheme:

``` scheme
(define (fold-left op init seq)
  (define (iter result rest)
    (if (null? rest)
        result
        (iter (op result (car rest))
              (cdr rest))))
  (iter init seq))
```

And using `fold-right` (accumulate) from earlier in the text:


``` scheme
(define (fold-right op first list)
  (if (null? list)
      first
      (op (car list)
          (fold-right op first (cdr list)))))
```

To show that fold-left and fold-right are different, the authors ask for the values of:

``` scheme
(fold-right / 1 (list 1 2 3))
; => 3/2

(fold-left / 1 (list 1 2 3))
; => 1/6
```

However, that does not show _why_ they are different. To get a better understanding of why these functions are different, I used a feature of Scheme called quasiquoting, it's similar to quoting, but allows for partial evaluation, I'll explain with an example:

``` scheme
(define a 2)

(square a)   ; value is 4             Evalutation
'(square a)  ; value is (square a)    Quoting
`(square ,a) ; value is (square 2)    Quasiquoting
```

Quoting returns the expression itself, not the value it evaulates to. Quasiquoting returns the expression itself, after evaluating all the expressions after commas.

So, to study the `(fold-right / 1 (list 1 2 3))` and `(fold-left / 1 (list 1 2 3))` computations, we can redefine `/` to use quasiquoting, and prevent the scheme interpreter from evaluating it all the way down to a number. Instead of `(/ 1 2)` evaluating to `1/2`, we want it to evaluate to `(/ 1 2)`.

``` scheme
(define (/ x y) `(/ ,x ,y)))
```

Then, recompute the values:

``` scheme
(fold-right / 1 (list 1 2 3))
; => (/ 1 (/ 2 (/ 3 1)))

(fold-left / 1 (list 1 2 3))
; => (/ (/ (/ 1 1) 2) 3)
```

This expanded view makes it very clear how these functions are different. It also suggests that they are different only for non-associative operators.

Here's [another example of quasiquoting](/blog/2013/04/07/visualization-of-sicp-exercise-1-dot-14#quasiquote) that is useful for visualizing the recursive structure of a computation.



