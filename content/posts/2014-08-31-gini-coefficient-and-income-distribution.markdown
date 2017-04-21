---
categories:
- mathematics
- economics
- politics
comments: true
date: 2014-08-31T00:00:00Z
title: Gini Coefficient and Income Distribution
url: /2014/08/31/gini-coefficient-and-income-distribution/
---

The gini coefficient is a measure of income inequality. It is calculated by ordering the given population by income, then calculating the cumulative distribution, and finding out how much it deviates from total equality.

So for example, assume there are four people, and everyone makes the exact same amount:

<img src="/images/blogimg/gini/equal_hist.png">

Then, the cumulative distribution just sums the values to the left, so for this hypothetical equal society of four, the cumulative distribution would look like this:

<img src="/images/blogimg/gini/equal_cumulative.png">

So, as you can see, the cumulative distribution would be a straight line. The gini coefficient is calculated as two times the area of the difference between this straight line and the actual distribution. Since in this hypothetical world, the distribution is totally equal, it follows that the gini coefficient is 0.

The way to read the gini coefficient is that 0 is totally equal, and 1 is totally unequal. In the totally unequal case, one person would make everything, and everyone else would make nothing:

<img src="/images/blogimg/gini/unequal_cumulative.png">

As is probably obvious at this point, the gini coefficient can be any real number between 0 and 1, with lower meaning more equal, and higher meaning less equal.

However, reality is always more interesting (and messier). The real world gini coefficient in 2014 of the United States 0.42, and Switzerland is 0.31

By modeling the cumulative distribution function as a power, such as x<sup>n</sup>, you can find an n that reproduces the same gini coefficient:

{% img /images/blogimg/gini/gini_us_ch.png %}

In 2013, the United States had a gini coefficient of 0.42, which corresponds to a distribution curve that is about x<sup>2.45</sup>, by contrast, Switzerland has a gini coefficient of 0.31, which corresponds to a distribution curve that is about x<sup>1.9</sup>

It's important to note that the cumulative distribution function is most likely not a simple power, but this shape does give a decent guess at what the respective distributions might look like.

Also, the gini coefficient says nothing about the absolute standard of living, meaning that a rich country and a poor country could have the same gini coefficient. For example, Norway and Czech Republic both have a gini coefficient of about 0.25, but Norway's GDP per capita is about 5 times more than Czech Republic's.

Given these limitations, the gini coefficient is a useful number for getting an idea about how income is distributed in a given population.
