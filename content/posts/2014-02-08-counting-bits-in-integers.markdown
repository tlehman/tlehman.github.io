---
categories:
- programming
- mathematics
- C
- cribbage
comments: true
date: 2014-02-08T00:00:00Z
title: Counting bits in integers
url: /blog/2014/02/08/counting-bits-in-integers/
---

While working on the code to count the number of fifteens I had in a hand in cribbage, I found it would be useful to count the number of bits in an integer. The comment below explains why it is useful.

``` c
    // Fifteens
    //     A Fifteen is any combination of cards whose ranks sum up to 15.
    //
    //     To find fifteens, we need to look at all combinations of cards.
    //     For example, for a hand of three cards:  5♣  10♥  5♥  we must
    //     consider all 2^3 - 1 = 7 non-empty subsets:
    //        Hand         | Bits | Sum
    //        -------------|------|-----
    //                 5♥  | 001  |  (5)
    //            10♥      | 010  | (10)
    //            10♥  5♥  | 011  | (15)  *
    //        5♣           | 100  |  (5)
    //        5♣       5♥  | 101  | (10)
    //        5♣  10♥      | 110  | (15)  *
    //        5♣  10♥  5♥  | 111  | (20)
    //
    //     There is a well known correspondence betweeen subsets and binary
    //     representations of integers, illustrated in the 'Bits' column above.
    //     The number of bits that are equal to 1 is the cardinality of the 
    //     corresponding subset.
    //     Using this correspondence, we can enumerate all 2^n subsets by looping
    //     an integer from 0 to (2^n - 1) and identifying the bits that are one
    //     with the subset membership relation.
    //
    Card* subset[count];
    for(i = 0; i < 2_TO_THE(count); ++i) {
        zero_cards(subset);

        // get bits of i
    }
```

Since subsets and the bit representations of integers are in one-to-one correspondence, I can enumerate all subsets of an n-set by simply counting from 0 to 2<sup>n</sup>-1, then I can use the bits in the loop variable to determine which element of the set is in the subset. From the example in the comment above, you can see that the bits of the row number line up with the elements in the subsets.

In order to finish this code, I wanted a way to count the number of bits in an integer. I looked around for an existing algorithm to do it, and I found this, from K&R:

``` c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v
for (c = 0; v; c++) {
    v &= v - 1; // clear the least significant bit set
}
```

I had no idea how it worked, so I tried to figure it out. The parts that I do understand are the roles of v and c, the former is the number for which we are counting bits, and the latter is the actual number of bits.

Why does `v & (v-1)` clear the least significant bit?

To figure this out, I considered a general n-bit integer, represented in base 2, I thought about it as 

{% latex %}
$ v = v_1v_2...v_n $
{% endlatex %}

If v is odd, then v<sub>n</sub> = 1, so v-1 simply clears the least significant bit, and since the first n-1 bits are the same, the bitwise AND of v and v-1 is just v-1, which v with the least significant bit set to zero (cleared).

Otherwise, v is even, which means v<sub>n</sub> = 0. What is v-1 in this case?

If v = 32 = 100000<sub>2</sub> (base 2), then v-1 = 011111<sub>2</sub>, so v&v-1 = 000000<sub>2</sub>, which is v with it's least significant bit set to zero.

So far, so good, but that is only one example, we need to prove it for a general even n-bit integer, not just 32.

Let v be an n-bit even integer, and v<sub>k</sub>=1 is the least significant bit. Then v<sub>n</sub>=0, and k < n.

We can then write v in the following way:

{% latex %}

\begin{align}
  v &= v_1v_2v_3...v_kv_{k+1}...v_n
\\  &= v_1v_2v_3...10...0
\end{align}

{% endlatex %}


Then, the number v<sub>k</sub>v<sub>k-1</sub>...v<sub>n</sub> = 2<sup>n-k</sup>

We can find v-1 by considering the subproblem of v<sub>k</sub>v<sub>k+1</sub>...v<sub>n</sub> - 1 = 2<sup>n-k</sup>-1.

{% latex %}

\begin{align}
    &v_k &v_{k+1} &v_{k+1} &... &v_{n-1} &v_n &- 1
\\  &1   &0       &0       &... &0       &0   &- 1
\\ =  &0   &1       &1       &... &1       &1
\end{align}
 
{% endlatex %}

Now, we can see that v and v-1 have the same first k-1 bits, with the last n-k+1 bits opposite, so that the bitwise AND clears the last n-k+1 bits. Since v has the last n-k bits equal to 0 and the k-th bit equal to one, it follows that v&(v-1) clears the least significant bit. This completes the proof.

Now, looking at the code again:

``` c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v
for (c = 0; v; c++) {
    v &= v - 1; // clear the least significant bit set
}
```

This will clear the least significant bit, increment c, then if v is nonzero, repeat. Now this makes sense.

