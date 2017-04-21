---
categories:
- mathematics
- programming
- ruby
comments: true
date: 2013-04-30T00:00:00Z
title: Fixed point in ruby hash function
url: /2013/04/30/fixed-point-in-ruby-hash-function/
---

A fixed point of a function  \\( f:S \to S \\) is an element \\(x \in
S\\) such that 

{% latex %}
$ f(x) = x $
{% endlatex %}

That is, \\(f\\) is a no-op on \\(x\\). Some examples: 

 - The identity function on any set has all points as fixed points
 - The absolute value function has any positive real number as a fixed
   point
 - The [base64 encoding function has a string as a fixed point](http://fmota.eu/blog/base64-fixed-point.html)

(Check out that link above, fmota wrote about how they discovered a
fixed point in the base64 encoding function, it's very interesting)

Ruby's `Fixnum` class has an instance method called `hash`. It is the
[hash function](http://en.wikipedia.org/wiki/Hash_function#Hash_tables) 
used by the `Hash` class to locate the value.

One thing to note that is interesting, 

``` ruby
42.class == 42.hash.class # true
```

The integer literal `42` is an instance of Ruby's `Fixnum` class,
which is exactly the type that is returned by `Fixnum#hash`. So, if we
let `N` be the set of all `Fixnum` values, and `h` be the hash function,
then the function 

{% latex %}
$h: N \to N $
{% endlatex %}

Does `h` have a fixed point? Let's find out, the generic way to find a
fixed point is to apply the function over and over and see if any of
the iterates are the same: 


{% latex %}
$ x, f(x), f(f(x)), f(f(f(x))), f(f(f(f(x)))), ... $
{% endlatex %}

In Ruby, we could start with a value `n` and loop until the next step
is the same as the current step: 

``` ruby

def find_fixed_point(n)
  m = n.hash

  while n != m
    puts n

    n = m
    m = m.hash
  end

  puts n
  puts m
end

find_fixed_point(42)
```

This code terminates in 62 steps, here is the output:

```
42
1818615832163790001
97302458964831319
3241638738618469355
-1538644867632915805
4556542729113842835
-707745146237515789
4042604241838953267
-3938749251519753037
-3262109345615183437
2726245977638182835
2363300705344768947
-1077013243652537421
3673817879955862451
4480325791167763379
-3402798086540651597
4108231692027892659
742946247983240115
3380480562708485043
-3611524319884209229
2461606551736423347
2556374051055866803
-853528980180560973
301437974151041971
-684460774007630925
2785951334519935923
1234765569947210675
3485015807817552819
-2988541774381313101
-2969442663896050765
3743208565546292147
-2143850698816220237
985968426639299507
-2191943438346873933
465213455999570867
-1249312491853966413
-1963857645314632781
3582438201892410291
146054934450017203
-2298892513473850445
-813726632499604557
-1775501339152477261
-4287223502620716109
-2436529928794664013
-3361799749893745741
487423333182608307
4144170308747006899
1852752892089734067
1009031649399542707
-1504821367603326029
-1663010304514714701
1979275894121173939
657469403487933363
-3805597827236228173
-608042091803176013
3625341557925090227
-4337022583265946701
4381946295323333555
-3544389048848739405
-4409080177303874637
3084909602640630707
1931988098033783731
-373854911179910221
4237831107247477683
4237831107247477683
```

So the integer `4237831107247477683` is a fixed point of
`Fixnum#hash`, that means that in the implementation of `Hash`, the
value `4237831107247477683` would have itself as a key.

There are more examples (play with the code yourself!), and I would
like to look deeper into why this hash function has a fixed point.
