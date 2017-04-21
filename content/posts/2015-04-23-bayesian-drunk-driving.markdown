---
categories:
- probability
- bayesian
- mathematics
- statistics
comments: true
date: 2015-04-23T00:00:00Z
title: Bayesian Drunk Driving
url: /2015/04/23/bayesian-drunk-driving/
---

Driving drunk is illegal for a good reason, it's way riskier than driving sober. This article isn't about driving drunk 
though, it's more about the sloppy thought processes that can too easily confuse something as obvious as that first 
sentence. Here's an example of a bogus argument that appears to support the idea that drunk driving is actually safer:

<blockquote class="twitter-tweet" lang="en">
<p>From a recent talk: 1/3 of accidents involve drunk drivers, so 2/3 don’t =&gt; sober drivers 2× as bad.</p>
&mdash; Colin Beveridge (@icecolbeveridge)
<a href="https://twitter.com/icecolbeveridge/status/587317304335147008">April 12, 2015</a>
</blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

So the argument is as follows: In 2012, 10,322 people were killed in alcohol-impaired driving crashes,
accounting for nearly one-third (31%) of all traffic-related deaths in the United States [1].
That means that approximately one third of traffic-related deaths involve drunk driving, meaning that 
two thirds of traffic-related deaths don't involve drunk driving. Therefore, sober drivers are twice as
likely to die in a traffic accident.

If you think something is wrong with that argument, you are right, but it's not just because the conclusion 
intuitively seems wrong, it's because it involves a mistake in conditional probability. To see the mistake, 
it helps to introduce a litle notation, we will define:

 - P(D) to be the probability that a person is drunk
 - P(A) to be the probability that a person will die in a traffic-related accident 
 - P(D | A) _(pronounced probability of D given A)_ is the probability that a person is drunk, given that 
   there was a death in a traffic-related accident they were in

So using the 2012 CDC data, we can assign 31%, P(D | A) = 0.31. This is that the probability of a drunk 
driver being involved __given that there was a deadly driving accident__.

The first thing to point out is that the statement that 'sober drivers are twice as likely as drunk drivers 
to die in an accident' is really a statement about P(A | D), that is, the probability of a deadly driving 
accident __given that that person is drunk__. We don't know this yet, however, we can figure it out using 
Bayes' theorem.

## Bayes' Theorem

[Bayes' Theorem](https://en.wikipedia.org/wiki/Bayes%27_theorem) is unusual in that it is extremely useful 
and easy to prove, but hard to really understand.
This is something I learned several times in college, but never really understood it's importance until much 
later. To see how easy to prove it is, we go back to the definition of conditional probability:

{% latex %}
$P(X|Y) = P(X \cap Y)/P(Y)$
{% endlatex %}

Where P(X &cap; Y) is the probability of X and Y occurring. Since this is true for any pair of events X and Y, 
we can reverse them and get

{% latex %}
$P(Y|X) = P(Y \cap X)/P(X)$
{% endlatex %}

Also, remember that AND is commutative, so that P(X &cap; Y) = P(Y &cap; X), so we can multiply the above two 
equations by P(Y) and P(X), respectively, to get:


{% latex %}
$P(X|Y)P(Y) = P(X \cap Y) = P(Y \cap X) = P(Y|X)P(X)$
{% endlatex %}

This relates P(X|Y) to P(Y|X), P(X) and P(Y), we can solve the above equation to get:

{% latex %}
$P(X|Y) = {P(Y|X)P(X)\over P(Y)}$
{% endlatex %}

And that's it, we took the definition of conditional probability, did a little algebra, and out popped Bayes' 
theorem, we can now apply this to the above drunk driving fallacy, and calculate the probability that we are 
interested in, that is, P(A | D).

{% latex %}
$P(A|D) = {P(D|A)P(A)\over P(D)}$
{% endlatex %}

Since we know P(D|A), we just need to find P(A) and P(D). Since the CDC data we are using is annual data,
we need to take the number of casualties from deadly accidents in the United States for the year of 2012 (33,561)
and divide by the number of drivers (211,814,830), that gives an estimate of P(A) = 33,561/211,814,830 = 
0.0001584, which is about 1 in 6,313.

Next, we need to find the probability that a driver is drunk P(D), we will use the data from the study 
referenced in [3], and define 'drunk' to be a BAC of &geq; 0.1%. Then P(D) = 0.00387 or about 1 in 258 (more 
on this calculation in the notes below).

Now that we have:
   
   P(D|A) = 0.31 (* probability of a driver being drunk, given they were involved in an accident where someone died *),

   P(A) = 0.0001584 (* probability of a driver being involved in an accident where someone died *), and

   P(D) = 0.00387 (* probability of a driver being drunk *)

We can figure out P(A|D) (* probability of a drunk driver getting into a deadly accident *)

P(A|D) = P(D|A)P(A)/P(D) = (0.31*0.0001584)/0.00387 = 0.0127 (1.27 %)

1.27% is not insignificant, it's about half the probability of rolling snake eyes in craps.
Now, let's compare that to sober driving, we just need to calculate P(A|D<sup>c</sup>). We can use [Kolmogorov's 
Theorem of total probability](https://en.wikipedia.org/wiki/Law_of_total_probability), shuffle a few terms to 
get:

P(A|D<sup>c</sup>) = (P(A) - P(A|D)P(D))/P(D<sup>c</sup>) = (0.0001584 - 0.0127*0.00387)/(1-0.00387) = .000109, 
which is about 1 in 9118.

## Conclusion

So the probability of getting in a deadly accident, given that you are drunk is 1.27%, and the probability of getting into 
a deadly accident, given that you are not drunk is .01%, that means that it is 127 times more likely that you will get into 
a deadly accident while drunk.


### References

[1] Impaired Driving: Get the Facts *Centers for Disease Control*
<a href="http://www.cdc.gov/Motorvehiclesafety/impaired_driving/impaired-drv_factsheet.html">
[link]
</a>

[2] Total licensed drivers *U.S. Department of Transportation Federal Highway Administration*
<a href="http://www.fhwa.dot.gov/policyinformation/statistics/2012/dl22.cfma">
[link]
</a>

[3] Probability of arrest while driving under the influence (George A Beitel, Michael C Sharp, William D Glauz)
<a href="http://www.ncbi.nlm.nih.gov/pmc/articles/PMC1730617/pdf/v006p00158.pdf">
[link]
</a>

*Notes on [3], we don't technically have P(D), but we do have P(D|A<sub>1</sub>), P(A<sub>1</sub>), 
and P(A<sub>1</sub>|D), where A<sub>1</sub> is the event that a person is arrested. We can then find
P(D) = (P(D|A<sub>1</sub>)P(A<sub>1</sub>))/P(A<sub>1</sub>|D) = (0.06&times;0.000374)/0.0058 = 
.00387*.
