---
categories:
- probability
- mathematics
- github
comments: true
date: 2012-07-21T00:00:00Z
title: Probability of getting a numerical SHA-1 hash
url: /2012/07/21/probability-of-getting-a-numerical-sha-1-hash/
---

Git uses the [SHA-1 hash function](http://en.wikipedia.org/wiki/SHA-1) to ensure the integrity of the data it stores. One important property of this function is that if the input is changed very slightly, the output changes completely. The output is supposed to be indistinguishable from randomness.

Just yesterday, I was checking a git repository on GitHub, and I noticed
this:

{% img /images/blogimg/sha1num.png %}

The 10 character substring of the full SHA-1 hash of the latest commit
happened to be all numerical. How likely is this to happen?

Well, since good hash functions are supposed to produce output that is indistinguishable from randomness, we can assume they are randomly drawn from the sample space of all 40-character strings over the hexadecimal alphabet {0,1,2,...,d,e,f}. The probability that a single character chosen from this alphabet is numerical is just 10/16

Since each of the 40 characters is independent and uniformly distributed, the probability that the entire string is numerical is:

{% latex %}
  $ \Pi_{i=1}^{40}{\frac{10}{16}} = \left( \frac{10}{16} \right)^{40} = 6.8423 \times 10^{-9} $
{% endlatex %}

That is 0.0000000068423, that is really small, but also, I was only looking at the first 10 characters, so the probability is going to be bigger, it is (10/16)<sup>10</sup> = 0.0090949, or 0.9%. In fact, this is big enough that I should expect to see this every 112 commits.
