---
categories:
- mathematics
- algebra
- macros
- C
comments: true
date: 2013-02-18T00:00:00Z
title: Swap values in C without intermediate variable
url: /2013/02/18/swap-values-in-c-without-intermediate-variable/
---

Using the following properties of the XOR function:

 - Associativity

{% latex %}
  $(a \oplus b) \oplus c =  a \oplus (b \oplus c) $
{% endlatex %}

 - Commutativity

{% latex %}
  $a \oplus b =  b \oplus a $
{% endlatex %}

- Identity

{% latex %}
  $a \oplus 0 = a $
{% endlatex %}

- Self-Inverse

{% latex %}
  $a \oplus a = 0 $
{% endlatex %}

As a bit of trivia, note that all n-bit integers form an [Abelian Group](http://en.wikipedia.org/wiki/Abelian_group) under XOR. The proof of which can be found by using the obvious isomorphism of n-bit integers with `{0,1}`<sup>n</sup> under addition modulo 2. Note that addition modulo 2 is equivalent to bitwise XOR.

So, using the C programming language, we can use the convenient `^=` operator as a way to swap the values of a and b without using an intermediate variable.

```c
  a ^= b;      // (a ^ b)
  b ^= a;      // b ^ (a ^ b)   which is the original a
  a ^= b;      // (a ^ b) ^ b   which is the original b
```

Here is a full working program that implements this operation using a C macro:

```c
#include <stdio.h>

#define show(a,b)	printf("a = %d, b = %d\n", a, b);

#define swap(a,b) \
  a^=b;  \
  b^=a;  \
  a^=b;

int main(int argc, char *argv[]) {
  int a = 3, b = 5;
  show(a,b);

  swap(a,b);

  show(a,b);
  return 0;
}
```


