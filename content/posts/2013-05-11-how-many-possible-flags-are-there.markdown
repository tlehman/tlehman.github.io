---
categories:
- mathematics
- combinatorics
- command-line
- vexillology
comments: true
date: 2013-05-11T00:00:00Z
title: How many possible flags are there?
url: /blog/2013/05/11/how-many-possible-flags-are-there/
---

I have been thinking about Mars a lot more lately, and about possible colonization. The [Mars One](http://mars-one.com/) project is a non-governmental not-for-profit organization that is looking to send groups of four people, independent of nationality, to Mars in 2023.

One thing that came to mind was independence, just as the early North American settlers declared independence from Great Britain, I think that Martian settlers would eventually declare independence from the countries of Earth, provided they had a sustainable, self-reliant colony. 

As a side effect, the Martian settlers would probably choose a new flag, and then the math geek in me wondered how far this could go, **how many different flags are possible?** As humanity grows, evolves and expands, assuming that each nation that emerged had a flag, how many unique flags could possibly be created?

If we allow for any arbitrary size and aspect ratio, the number is infinite. However, most flags have the same aspect ratio, and their implementation as cloth is usually in fixed sizes. 

Note that flags are physically made of thread, we make the simplifying assumption that all flags are made of the same width thread, and that the thread is evenly spaced.

Flags have some terminology, so a few definitions are in order:

 - **Hoist** is the width of the flag (vertical direction)
 - **Fly** is the length of the flag (horizontal direction)
 - **Vexillology** is the "scientific study of the history, symbolism and usage of flags [[1]](http://en.wikipedia.org/wiki/Vexillology)

We will call **H** the number of threads in the vertical direction, and **F** the number of threads in the horizontal direction.

Assuming threads are evenly spaced, we can imagine the **H*F** crossing points on a grid, as in the image below: 

{% img /images/blogimg/flags/close_up.png %}

Each crossing point is either above or below, so there are 2 distinct choices for each of the **H*F** crossing points, that means that there are 2<sup><sup>HF</sup></sup> possible flags, ignoring color.

If we now consider the role of color, imagine that each of the **H+F** threads could have any of **C** distinct colors, then there would be C<sup><sup>(H+F)</sup></sup> possible color combinations.

Since the under/over configuration of the points is independent from the color choices, it follows from the combinatorial principle of products that there are: 

{% latex %}
$ 2^{HF}C^{(H+F)} $
{% endlatex %}

possible flags. This is the general solution, now let's find some real-world data and get some more constraints so we can compute some numbers. (*Everything following this formula is just finding the values of **H** and **F**, so if you don't care about the research, simplifying assumptions and data-wrangling, you can skip to the end*)

Typically there are fixed aspect ratios, and some correlation exists between the height of the flagpole and the hoist/fly.

## Height of the flagpole versus the fly and hoist


Using the United States' Deparment of Interior specifications as a model, we can use the following data to get an approximate relation between the height of a ground flag and the hoist/fly of the flag:


Ground Flagpoles [[2]](http://www.doi.gov/ofas/asd/upload/Flagsandseals9-25-12-2.pdf)

```
height (ft)  hoist (ft)    fly (ft)   aspect ratio (hoist/fly)
30           3.5           6.65       1.9
40           5.0           9.5        1.9
50           5.0           9.5        1.9
60           8.95          17         1.89
```

Since the aspect ratio is approximately constant (as we would expect), the problem of finding the relation between height, hoist and fly reduces to a one-dimensional linear regression. We now try to find fly as a function of height, which is in the **y** direction:

{% latex %}
$ f(y) = a + by $
{% endlatex %}

Using the [least squares method](http://en.wikipedia.org/wiki/Least_squares), the values of a and b are found exactly, the above formula becomes:

{% latex %}
$ f(y) = 0.3105y + (-3.31) $
{% endlatex %}

So given a height **y**, the fly of the flag should be about **(0.31)y - 3.31(ft)**.


## Aspect ratios


To find the aspect ratios of the current flags of Earth, I found [this](https://en.wikipedia.org/wiki/User:SiBr4/List_of_national_flags_by_aspect_ratio) on wikipedia. I went to the edit view and then copied the wiki source. On Mac OS X, the `pbpaste` command writes the contents of the clipboard to standard out on the command line. On GNU/Linux under Xorg, you can use `xclip -o` to achieve the same thing.


So I played around with the data and came up with this one-liner:

``` bash
> pbpaste | pre nts | awk -F\| '{print $3}' | sed 's/[\}]//g' | pcregrep '^\d' | sort -n | uniq -c
   1 0.820
   2 1
   1 1.154
   1 1.167
   1 1.25
   1 1.321
   5 1.333
   3 1.375
   1 1.389
   2 1.4
   2 1.429
   1 1.467
 114 1.5
   1 1.571
   5 1.6
   1 1.618
   1 1.636
  22 1.667
   2 1.75
   1 1.772
   1 1.864
   4 1.9
  83 2
   1 2.545
```

Most countries use 1.5, 2 and 1.667. As fractions, these are 3/2, 2/1, 5/3, respectively. Also, one country (Togo in Africa) uses 1.618 &#8776; &phi;, the Golden Ratio!

Since the overwhelming majority of flags use the 1.5 and 2 ratios, let us assume for this problem that these are the only ratios that will be used. Since the United States flag uses the 1.9 ratio, we can approximate it as 2. Just for reference, Russia and China use 1.5 and U.S.A. uses 1.9, and the U.K. uses 2.

Colonizers on other planets will initially be close to the ground and spread out. Since residential flags typically range between 15 and 20 feet, we will be safe and assume that the inital flag is 15 feet tall. From our formula, this means that the Fly will be (.3)(15ft) - (3.31ft) = 1.19 ft.

## Number of threads

To find the values of **H** and **F**, we need to know the width and spacing of the thread, a common size of polyester thread for making flags is [Size 69](http://www.thethreadexchange.com/miva/merchant.mvc?Screen=CTGY&Category_Code=nylon-thread-069), which has a diameter of 0.2921 mm. So, assuming that the threads are all adjacent, the number of threads in the Fly direction will be (1.19ft)/(0.2921 mm) &#8776; 1241.

The number of threads in the Hoist direction (assuming a ratio of 1.5) is 1241*(1.5) &#8776; 1861

## Number of Colors Distinguishable by the Human Eye

This number is about 10,000,000 [[4]](http://hypertextbook.com/facts/2006/JenniferLeong.shtml)

**The number of distinct, 15 foot, 3/2 flags made of size 69 polyester thread is **

{% latex %}
$ 2^{1861\times1241}(10,000,000)^{1861+1241} \approx 1.19 \times 10^{716943} $
{% endlatex %}

This is a 716,944 digit number, the number of possible flags is so much higher than [the number of atoms in the observable Universe](http://www.wolframalpha.com/input/?i=number+of+particles+in+the+universe) that it isn't even plausible to assume that all of them could ever be exhausted.


