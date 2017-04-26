---
categories:
- unix
- programming
- graph
- data-visualization
- command-line
- javascript
- sigmajs
comments: true
date: 2012-10-28T00:00:00Z
title: Unix Processes and Their Parents Part 2
url: /blog/2012/10/28/unix-processes-and-their-parents-part-2/
---

Based on a comment by Mark Essel from [part 1](/blog/2012/10/14/unix-processes-and-their-parents/) I have been trying
to add more metadata to the process tree. I have given up on doing it in a one-liner, so I started using bash scripts.

Then, after a few hours of hacking bash, I got annoyed with the difficulty of very basic things such as incrementing
integers and dealing with collections, so I switched over to Ruby, with some minor shelling out.

The result is [procviz](https://github.com/tlehman/procviz), it is some ruby code for generating a graph representing
the process tree at the time `Graph.new` is called.

It generates DOT files just fine, but the images can get big if your system has a lot of stuff running. Also, the only
metadata I have attached to the nodes so far is the command name:

<a href="/images/blogimg/proc_with_names.png">
  <img src="/images/blogimg/proc_with_names.png">
</a>

I wanted to make this into a more interactive visualization, but so far I have had a hard time getting Sigma.js or Arbor.js
to embed into this Octopress blog. I have been meaning to get a better understanding of javascript.
