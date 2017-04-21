---
categories:
- javascript
- mathematics
comments: true
date: 2012-07-18T00:00:00Z
title: MathJax for Octopress
url: /2012/07/18/mathjax-for-octopress/
---

I have had many blogs in the past that had some mathematical flights of fancy on them. Part of it was a log of fun things I was exploring, and another part was just showing off the neat capabilities of the CodeCogs LaTeX equation editor or some wordpress plugin that did the same thing. In one rare case, I (incorrectly) debunked an argument that [&pi; = 4](http://28.media.tumblr.com/tumblr_lbxrvcK4pk1qbylvso1_400.png).

It's not that &pi; actually turned out to be equal to 4, it's just that my argument was wrong. I learned a lot about convergence, and the true reason that the argument was false was much more subtle. I will reproduce this here in the next few posts.

For publishing math, you can use either MathML (a dialect of XML), or LaTeX (pronounced Lah-Tek). You can render LaTeX to an image or have it converted to selectable characters by JavaScript by [MathJax](http://www.mathjax.org/). 

I always used LaTeX to images because it was easier. The image could be embedded in ordinary HTML and that was it, it would always work. However, it didn't scale with the text very well, and the individual characters could not be selected.

So, here is an awesome example of MathJax in action, displaying some beautiful mathematics: the first Fundamental Theorem of Calculus. We start by assuming a and b are real numbers, and that f is a continuous, real-valued function on the interval `[a,b]`, and further that f is differentiable on the open interval `(a,b)`. The first Fundamental theorem states that:

{% latex %}
  $ \int_a^b f'(x) dx = f(b) - f(a) $
{% endlatex %}
