---
categories:
- ruby
- rails
- english
- opinion
comments: true
date: 2012-07-31T00:00:00Z
title: Convention over configuration, unless those conventions don't make sense
url: /2012/07/31/convention-over-configuration-unless-those-conventions-dont-make-sense/
---

Ruby on Rails is a so-called opinionated framework, this means that it bakes in a bunch of conventions for how applications should be built. By following these conventions, you can write less code, and make more software. This is great, unless some of those conventions depend on something inconsistent or irregular.

One thing that is particularly inconsistent and irregular is the English
language. Do you remember the rule for **I**s and **E**s? "I before E _except_
after C and _except_ after words _like_ neighbor and weigh...". This is
typical of the English language, exceptions abound. There is no
consistent rule we can give for combining the letters I and E in a
sentence.

Similarly, pluralization follows no single scheme, there are words like
'chair' that are pluralized as 'chairs', and then there are words like
'sheep' that are their own plurals. Finally, there are words inherited
from Latin like cactus, which can be pluralized as 'cactii' or
'cactuses'.

The reason I am bringing this up is that Ruby on Rails has a module
called `ActiveSupport::Inflector` that has pluralization methods built
into it. One of the conventions used in rails applications is the
following: if you have a data model representing a `thing`, then rails
generates a table in your database called `things`, where each record in
the database represents a single `thing`.

The inflector module kicks in so that you don't have to say what the
name of the table will be, rails takes care of that for you. This works
fine, most of the time. I recently had to fix an application that was
failing because it has ambiguous routes, that means that a route has
multiple possible controller actions it could trigger, this is not good,
hence the error. The culprit was a model called `series`. When you
pluralize it: 

``` ruby 
ActiveSupport::Inflector.pluralize("series")
 => "series"
```

The result is the same word, this leads to ambiguous routes, since there
is a `series_path` (singular) and `series_path` (plural) that are
supposed to mean different things.

This problem took me a few days to solve, and it would have been a
non-issue if I would just made my own database table names and route.
Not because my conventions are better, but simply because I would have
been forced to think about what things are called, instead of trusting
that the conventions of the framework will yield consistent results.

I think that 'convention over configuration' is a good idea, but only
when the conventions are logical and make sense. At the vary least,
there should be no ambiguities.
