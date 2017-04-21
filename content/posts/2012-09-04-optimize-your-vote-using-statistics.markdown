---
categories:
- mathematics
- statistics
- politics
comments: true
date: 2012-09-04T00:00:00Z
title: Optimize your vote using statistics
url: /2012/09/04/optimize-your-vote-using-statistics/
---

I used to hate the phrase "throwing your vote away.". This is usually
used in response to people voting for someone who is probably not going
to win. Even though we have [five major parties](http://en.wikipedia.org/wiki/List_of_political_parties_in_the_United_States#Major_political_parties) in the United States, chances are, the winner is going to either a Republican or a Democrat. 

The reason I hated that phrase so much is that it discourages people
from voting for their ideal candidate for pragmatic reasons. Chances
are, a non-Democrat, non-Republican is not going to win, so cut your
losses and pick a candidate that you *dislike least*.

However, as I've gotten slightly older, I have come to appreciate how
necessary compromise is. What has me more hopeful is that you can
compromise with precision. I'll explain what I mean by first giving some
context.

Scott Hanselman [mentioned this site on twitter today](https://twitter.com/shanselman/status/243032228655951872) called [isidewith.com](http://isidewith.com). It asks you a series of questions about issues that frequently arise in political debates. It then asks you to rate the importance of the issues, and then gives you a list of the percent with which you agree with all the candidates running for Present in 2012.

So, you can choose your ideal candidate based on how many issues you agree on. For example, I answered the questions and got this as a match: 

* Gary Johnson 83% 
* Jill Stein 82% 
* Barack Obama 81% 
* Mitt Romney 31% 

From these results, it looks like a very close call between Johnson,
Stein and Obama. Based on these results, my ideal candidate is probably
one of these three.

So here is where we can compromise with precision, since I have three
almost identical matches (with respect to the battery of questions I
answered about various political issues). I can now decide which of
these three to vote on based on the likelihood they will win.

The original reason I was so bothered by this is was that I thought that
ideals determined *one and only one* ideal candidate. But by letting
data about the issues determine which candidates were ideal, I
allow for the possibility of multiple near-ideal matches.

Then, given the set of near ideal matches, I can take into account which
is most likely to win, and cast my vote accordingly.

So, let's get to some statistics, since my title promised it, and
because we can use this to actually calculate who you should vote for.
In fact, if a good enough model can be generated to this effect, perhaps
we could replace voting for a single individual with taking a test, and
having a computer calculate your vote for you. That would be a much
better way to have the candidate reflect the majority views in the
United States.

Let's start with some definitions, the **expected value** of a random
variable X, where X can take on any of the n values {x<sub>1</sub>, ... x<sub>n</sub>} 
with corresponding probabilities {p<sub>1</sub>, ... p<sub>n</sub>}, is
just the sum of those probabilities, times the corresponding value:

{% latex %}
  $ E(X) = \sum_{i=1}^n p_ix_i $
{% endlatex %}

So the expected value is a sort of weighted average over all of the
values the random variable could take on. The part of this I will be
using is the p<sub>i</sub> factor. Given this definition, there
naturally follows an "expected maximum", denoted Emax(X).

{% latex %}
  $ Emax(X) = \max\{ p_ix_i \}_{i=1}^n $
{% endlatex %}

I make a further modification to
this model and use the **issues coefficient** c<sub>i</sub>. For example, I was an 83% match with Gary Johnson, so if Johnson is represented by the value x<sub>i</sub>, then c<sub>i</sub> = 0.83.

So, using this model we have two values that need to be accounted
for before we can decide who to vote for, there is p<sub>i</sub>, which is the probability that the i-th candidate will win, and then there is c<sub>i</sub>, the degree to which the voter agrees with the candidate on the relevant issues. Since we don't know who is going to win, we set all x<sub>i</sub> = 1, and we can ignore that altogether, so the expected maximum becomes:

{% latex %}
  $ Emax(X) = \max\{ c_ip_i \}_{i=1}^n $
{% endlatex %}

Now, in my case, I have all of the four c<sub>i</sub> values, but I don't
have the p<sub>i</sub> values. To find these values, we could start with
the number of electoral representatives per party. I have not been able to find
this data, but If I did, I could calculate the perfect choice of a vote,
one that would be balanced between idealism and pragmatism.

Note: If any of you can find data on the number of electoral
representatives per political party, I will happily make this into an
app that will calculate a suggestion based on this model. It will take
your [isidewith.com](http://isidewith.com) data and then weigh that with
the proportion of electoral votes for the corresponding party.
