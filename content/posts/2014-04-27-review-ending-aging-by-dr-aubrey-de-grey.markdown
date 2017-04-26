---
categories:
- review
- biogerontology
- books
- sens
- demography
- mathematics
comments: true
date: 2014-04-27T00:00:00Z
title: 'Review: Ending Aging by Dr. Aubrey de Grey (and some math about immortality)'
url: /blog/2014/04/27/review-ending-aging-by-dr-aubrey-de-grey/
---

I just finished reading [Dr. Aubrey de Grey](https://en.wikipedia.org/wiki/Aubrey_de_Grey)'s _Ending Aging:  The Rejuvenation Breakthroughs that Could Reverse Human Aging in Our Lifetime (2007)_, it was an accessible introduction to the biology of aging, and a way that it might be defeated. By default, I am skeptical about anti-aging techniques or claims of some sort of fountain of youth. I've heard de Gray's idea on a podcast, and watched his TED talk. It sounded reasonable, but I wanted to learn more about the science to have a more informed opinion, so I read the book.

<div style="float: right; width: 50%">
  <img src="/images/books/ending_aging.jpg">
</div>

The plan is referred to as SENS (Strategies for Engineered Negligible Senescence). After reading the book, I think it is a plausible plan for an approach to reverse the effects of aging. I'll summarize the idea and highlight some things from the book that weren't covered in de Gray's TED talk or podcast interview.

The central assumption of the book is that aging is the accumulation of seven types of damage:

 1. Mitochondrial DNA mutations
 2. Nuclear DNA mutations
 3. Intercellular junk _(e.g. [lipofuscin](https://en.wikipedia.org/wiki/Lipofuscin))_
 4. Extracellular junk _(e.g. [beta amyloids](https://en.wikipedia.org/wiki/Beta_amyloid))_
 5. Glycation _(stiffens tissues leading to stroke, heart disease, etc.)_
 6. Cells not dying when they are supposed to _(e.g. cancer)_
 7. Cells dying when they are not supposed to 

Each of these types of damage is covered in detail in the book, along with one or more possible solutions. For example, number (7) can be treated by using stem cells to replace the lost cells, this has already been demonstrated to work, but there are political hurdles to stem cell research. A comprehensive plan to completely reverse the effects of aging may change this.

Another example is (1), he explained how mitochondria, which generate energy in the cells, have their own DNA, and they produce lots of reactive byproducts that damage the mitochondria's own DNA. This can be fixed by saving a copy of the mitochondria DNA in the cell nucleus, where it is about 100 times less likely to mutate. Some forms of algae already do this, so it is not without precedent.

An interesting one is (5), or [glycation](https://en.wikipedia.org/wiki/Glycation), which is the process that leads to the gradual stiffening of tissues. Glucose in the blood sometimes sticks to proteins and causes them to tangle up, this is what happens with caramelization, but at a much slower rate. There are already biotechnology companies that are working on drugs that target glycation endproducts, it is possible to undo the glycation damage, further research is needed before all forms of glycation are fixed, but it is simply a matter of money and time.

All of the types of damage but (6) seemed relatively straightfoward to solve. It is (6) that is the most troublesome. Assuming all the other types of damage are satisfactorily solved, cancer is still a big problem. In order to keep a human healthy indefinitely, you'd need to prevent cancer growth. There are many types of cancer, and within cancers there are many types of cells, but they all have something in common. They have an active telemorase enzyme, which is what replenishes the telomeres (segments of junk DNA at either end, which shorten with every cell division). Since cancerous cells' DNA keeps getting it's telomere's restored, they can reproduce indefinitely, this is the main threat of cancer, it can grow forever, until it disturbs its surroundings (your healthy tissue).

Aubrey de Grey has a solution for this, but it is the most extreme of the book: _Remove all telemorase genes from all cells of the human body_. This means that the remaining human body only last about 10 years. Since nuclear DNA mutations are inevitable, and sometimes lead to cancers, having all your cells be unable to replenish their telomeres means that all cancers would eventually hit a wall (after about 50 cell divisions). Then, to solve the problem of your cells running out of telomeres, new stem cells could be engineered with a copy of your DNA (minus the gene for telemorase), and you could top off your stem cell supply every 5-10 years.

The problem with making all your cells immortal is that cancer will eventually win. By making all your cells mortal, even cancerous ones, you can continue to get SENS therapy until you no longer want to stay alive. If aging is indeed the sum of those 7 types of damage, then this panel of therapies will enable humans to live indefinite youthful lifespans.

So it appears possible to keep humans alive as long as they want to live, and prevent the decay and the eventual death of the body. This is fantastic, as the majority of healthcare spending is due to this decay. If SENS (or something like it) can be developed afforably, it would save nations trillions of dollars in healthcare and social security spending, as well as give people the choice to live for centuries.

There is a follow up question that the book didn't address, but it was outside the scope of the book, so I'll address it here.

<a id="moral-immortal">
## Should humans pursue indefinite lifespans?
</a>
Yes.

Why? Humans that have no intention of harming other humans deserve life. Removing things that cause harm to other humans is good. Aging leads to death for all humans, therefore aging should be removed.

Practically, our technological and social progress reflects this to some degree. Cars have become safer over the last 50 years, smoking is become less and less common.

Another bit of progress is in HIV/AIDs, it is now under control, for example, Magic Johnson has [survived for 23 years with HIV](http://www.livescience.com/16909-magic-johnson-hiv-aids-anniversary.html) and is able to live a normal life. With the advent of highly active antiretroviral therapy, anyone with HIV can live a normal life and not fall victim to AIDS.

Over the last century, [life expectancy has increased by a factor of 1.6](http://demog.berkeley.edu/~andrew/1918/figure2.html), and is increasing still.

I don't think it's controversial to say most people want to live forever. In fact, the major religions embody this since they all have some element of eternal life. The problem is that they are all fantasies, up until now, all living organisms eventually age and die, and when they die, they are gone forever.

Of course, the extension of life is not without some tradeoff, if you prevent old people from aging you prevent a lot of deaths, which has environmental consequences. With people living forever instead of dying and making room for the next generations, our current infrastructure would be strained, and it we would eventually run out of potable water, food, and land. These are just the immediate problems for humans, not to mention global warming, trash, and other unwholsome byproducts of human civilization.

Why then do I still think this should be done? Notice I said "our current infrastructure". I don't think our infrastructure and technologies will stay the same, they will grow and adapt as humans learn more and produce more.

Before we can answer the environmental question of should humans pursue indefinite lifespans, we should look at what is currently happening, what could happen, and then get back to the question.

### Current demography

There are three possible growth scenarios for the population: decrease, stay constant, increase. Right now the population is increasing, although [using UN Data, Hans Rosling shows](http://www.gapminder.org/videos/dont-panic-the-facts-about-population/) that the rate of population growth is slowing.

For the purposes of this article, it is useful to define a variable:

{% latex %}

$ r = \frac{\text{generation }n + 1}{ \text{generation } n } $

{% endlatex %}

Another variable that is related to r is the Total Fertility Rate (TFR), which can be thought of as the average number of children per couple. The [global average right now is 2.609](http://www.wolframalpha.com/input/?i=Total+Fertility+Rate). At 'replacement rate', where TFR = 2, r = 1, since the previous generation is equal to the next generation.

Rosling's talk shows how as health and wealth increase, TFR decreases, where in most developed countries it is about 2.
 
Now, let us suppose SENS works, and is affordable for everyone (perhaps as an alternative to retirement social security, or part of a life insurance opt out). Then, as people reproduced, if TFR > 2, it follows that population would grow. If nothing changed, then we would run out of resources and space.

If TFR = 2 and stayed that way (very unlikely it would stay constant, but let's assume), then the population would grow linearly, minus the accidental death/suicide rate.

If TFR < 2, then it gets interesting, if TFR < 2, then the population of children would get smaller each subsequent generation. Call the current population p, for each member of the population, there would be an average number r of children (in the case of TFR=1.9, r = 2/1.9 = 0.95).

Assume there is no death at all, then the population after one generation would be p + pr. Two generations later it would be p + pr + pr<sup>2</sup>. After an infinite number of generations, it becomes:

{% latex %}
 $p + pr + pr^2 + pr^3 + pr^4 + ...$ 
{% endlatex %}

It is easy to show what this infinite series converges to, if you haven't seen it before, or if you've just memorized the geometric series, I'll show how to derive it:

{% latex %}

\begin{align}
  p + pr + pr^2 + pr^3 + pr^4 + ... &= S
\\ r(p + pr + pr^2 + pr^3 + pr^4 + ...) &= rS
\\ pr + pr^2 + pr^3 + pr^4 + pr^5 + ... &= rS
\\ pr + pr^2 + pr^3 + pr^4 + pr^5 + ... &= S - p
\\ rS &= S - p
\\ rS - S &= -p
\\ (r - 1)S &= -p
\\ S &= p/(1-r)
\end{align}

{% endlatex %}

So the series converges to p/(1-r), meaning a constant |r| < 1 would lead to a finite upper bound on the human population.

I didn't show that the series converged if |r| < 1, but that is an elementary fact proven in most calculus classes, I'll leave it to the reader as an exercise.

What this means is that under certain reasonable conditions (r < 1), you can have immortality _and_ procreation, without an explosion in population.

However, that eventuality depends on a constant r < 1, and it's also asymptotic, so even if it's eventually correct, it doesn't give us any information about now, and the next few centuries.

In order to sustain human life, we need:

 1. water
 2. energy
 3. food
 4. shelter
 5. disposal of waste

Some of these are interdependent, like 2 leads 1, if we have lots of energy, we can desalinate the ocean and get drinkable water. Also, 1 & 2 lead to 3, since water and energy (sunlight) lead to plants (food).

One problem with 3 is that food is currently grown in huge wide patches far away from urban centers. This doesn't scale well, it uses a lot of surface area, pesticides and fuel to ship the food to cities and other urban centers. However, Dickson Despommier solved this with the [vertical farm](http://www.verticalfarm.com/). It solves the area problem by stacking many levels on top of each other (where the word 'vertical' comes from). It also solves the problem of fuel, since you can build these vertical farms in the city, [this is already being done in Singapore](http://www.npr.org/blogs/thesalt/2012/11/06/164428031/sky-high-vegetables-vertical-farming-sprouts-in-singapore). And it is possible to build habitats for farm workers into the vertical farm itself, which means that 3 (food) can lead to 4 (shelter) in some cases.

Also, with the development of colonies in space, and on the Moon and Mars, overpopulation can be avoided by exporting Earthlings to new places. Any working space colony will necessarily have to be very efficient at recycling waste, so space colonization leads to 5 (disposal of waste).

All of this suggests that the problems we face now with our current population, infrastructure and technologies can be solved by building better infrastructure and technologies, and those technologies already exist in primitive form. Eliminating the disease of aging does mean that we will end up running out of resources and all starve. We can have more people, living longer lives, and together solve all the problems that prevent our species' long term survival.


Sources:

 1. de Grey A, Rae Michael. Ending Aging: The Rejuvenation Breakthroughs That Could Reverse Human Aging in Our Lifetimes
 2. Gavrilov LA, Gavrilova NS. Demographic consequences of defeating aging. Rejuvenation Res. 2010;13:329–334. [PMC free article](http://www.ncbi.nlm.nih.gov/pmc/articles/PMC3192186/) [PubMed](http://www.ncbi.nlm.nih.gov/pubmed/20426616)
