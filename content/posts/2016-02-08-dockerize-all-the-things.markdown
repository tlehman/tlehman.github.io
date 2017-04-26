---
categories:
- docker
- dependencies
- linux
- blogging
comments: true
date: 2016-02-08T00:00:00Z
title: Dockerize all the things
url: /blog/2016/02/08/dockerize-all-the-things/
---

Okay, maybe not _all_ the things, but the things that tend to litter your
filesystem with libraries, dependencies and other crap that increases the  
chances of a conflict.

If you are not familiar with [Docker](https://www.docker.com/what-docker),
check it out, then come back here and troll my flaming fanboy drunk on kool aid
ravings in the comments.

I write a lot of ruby and python code, and I also use a lot of ruby/python and
javascript code other people wrote as well. For ruby, I use the rbenv version
manager to isolate different versions of ruby from one another, this is because
some applications use features that are only present in newer versions, and also
I use bundler to isolate gems between different applications using the same ruby
version.

This blog is generated from markdown using the octopress ruby project that
generates HTML from the markdown I write. My version uses ruby 1.9.3, which is
pretty old, but for a static site, there are no security risks, since by the
time the blog is published, it's just a bunch of html files.

On the python side, there are a lot of machine learning libraries and frameworks,
like GraphLab, caffee, TensorFlow, etc. that all link into statically compiled
C++ code. These take a long time to get set up manually, and they have a sprawling
web of dependencies spanning multiple languages. Virtualenv makes it possible to
isolate python projects from each other, but it's yet another thing to remember
and takes more time just to use properly.

Docker comes in as a more general way of isolating applications from one another.
Instead of having each language and application using some specialized isolation
tool, all applications can be run within docker containers, each of which is
completely unaware of any other container. Each of these containers shares the
same Linux kernel and hardware, so they are lightweight compared to virtual
machines. It is also possible to selectively allow containers to communicate,
that is what docker-compose is for.

Since Docker uses Linux-kernel-specific features like
[control groups](https://en.wikipedia.org/wiki/Cgroups), if you are running
Docker on any other operating system, you need to have a virtual machine, then
within that virtual machine, all the containers share that kernel. I recently
decided to get a high end laptop that runs linux, and it was specifically for
doing all my personal development work using Docker as much as made sense.

So far I have my octopress blog, my goga.me (Go Game rails app), my Dato GraphLab
machine learning environment, a node.js environment (never installing npm on my host), 
TensorFlow and the Google research deepdream code running in docker containers.
The last two can make use of
my GeForce GTX 970M with 1280 CUDA Cores, so it's pretty sweet.

There are things that I don't think should be dockerized, like [Fritzing](http://fritzing.org/home/)
for electric circuits, and the Arduino IDE. Also my browser. So far it seems like
anything that can be installed and run out of the box without configurations or
numerous dependencies shouldn't be made into containers.

I'd love to hear from more experienced Docker users about how it fits in their
workflows, I just got started, so I'm probably still in the excited noob stage to
really offer anything original.
