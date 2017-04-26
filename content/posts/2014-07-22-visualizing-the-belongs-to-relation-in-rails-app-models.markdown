---
categories:
- graphviz
- rails
- ruby
- command-line
- data-visualization
comments: true
date: 2014-07-22T00:00:00Z
title: Visualizing the 'belongs to' relation in rails app models
url: /blog/2014/07/22/visualizing-the-belongs-to-relation-in-rails-app-models/
---

When working on rails apps, I usually have to make a mental map of the models and how they interrelate.

An Active Record model can belong to another, but when you have more than half a dozen models, keeping all
the belongs_to relations in mind quickly becomes impossible. As a solution to this, I made a command line
program called [argraph](https://github.com/tlehman/bin#argraph), for 'ActiveRecord graph', it produces a digraph in the
[DOT language](http://www.graphviz.org/doc/info/lang.html), which can be rendered as an image
using [GraphViz](http://www.graphviz.org/).

The nodes are models, and the edges are the 'belongs to' relation.

The way to use it is to check it out or fork my [bin](https://github.com/tlehman/bin) repo, make sure that directory
is in your PATH variable, cd to the root of your rails app and run `argraph`.

As an example, suppose you have the [discourse](https://github.com/discourse/discourse) rails app checked out,
and you want to find out how some of it's models are interrelated:

```
$ cd discourse
$ argraph Post Topic Category PostReply User UserAction UserHistory QuotedPost View UserAvatar
digraph {
 Post -> User
 Post -> Topic
 Topic -> Category
 Topic -> User
 Category -> Topic
 Category -> User
 PostReply -> Post
 UserAction -> User
 QuotedPost -> Post
 QuotedPost -> QuotedPost
 View -> User
 UserAvatar -> User
}
$ !! | dot -Tpng > discourse.png
```

The above graph renders as:
![discourse model graph](https://i.imgur.com/YQOyHUn.png)

You can also run the command with no arguments, in which case it maps out all models, but on bigger apps, this can be hard to follow,
so I found it useful to be able to explore subgraphs containing more models than my memory could fit, but not so many that the image
was polluted and hard to follow.
