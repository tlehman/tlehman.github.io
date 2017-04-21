---
categories:
- politics
- git
- github
- open-government
- csv
- golang
comments: true
date: 2015-02-03T00:00:00Z
title: White House releases first ever open source budget proposal
url: /2015/02/03/white-house-releases-first-ever-open-source-budget-proposal/
---

The White House just released the [first ever open source budget proposal](https://github.com/WhiteHouse/2016-budget-data). It is released on GitHub, and it's a bunch of CSV files. This is not very difficult, it requires only a few extra clicks when exporting an Excel spreadsheet, but hosting it on GitHub also opens it up to [Pull Requests](https://help.github.com/articles/using-pull-requests/), which I've [talked about before](/blog/2013/09/14/viewing-nsa-accountability-act-amendments-as-a-diff/) as being a much better tool for 21st century democracy. Instead of paper and a bunch of politicians in a room following procedure, we should intead have a digital system where all citizens can contribute as easily as they can update a facebook status or apply an instagram filter.

One huge caveat is in order though: there is no reason to assume that the White House and Congress will even consider pull requests, let alone apply them. This aside, I will experiment with this, I've already modified [textql](https://github.com/dinedal/textql/pull/39) so that I can easily query these CSV files from a SQLite database. If I have an idea about how I'd like to change the budget, I'll submit the pull request and then follow it's response, if any.

Caveats aside, I am impressed with the choice of technologies for making these public issues more accessible.
