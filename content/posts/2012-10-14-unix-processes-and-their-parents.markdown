---
categories:
- unix
- programming
- graph
- graphviz
- data-visualization
- command-line
comments: true
date: 2012-10-14T00:00:00Z
title: Visualizing Unix processes and their parents
url: /2012/10/14/unix-processes-and-their-parents/
---

I am reading Jesse Storimer's fantastic little book ["Working with Unix Processes"](http://workingwithunixprocesses.com/) right now, and inspiration struck after the second chapter "Processes Have Parents".

When a Unix process is born, it is a literal copy of it's parent process. For example, if I am typing _ls_ into a bash prompt, the bash process spawns a copy of itself using the _fork_ system call. The parent process (bash) has an id which is associated with the child process (ls). Using the Unix _ps_ command, you can see the parent process id of every process on the system.

The only process that has no parent is _sched_, it has process id zero. The idea I had was to make a visualization of this branching tree of Unix processes. I am currently running Debian GNU/Linux, a Unix-like operating system. I came up with this one-liner that shows the (parent id -> child id) relation:

```sh
ps axo ppid,pid | sed "s/\b / -> /g" | grep -v "PID"
```

The first part calls *ps* and gets all process ids, and their parents. Some sample output is this:

```
~ > ps axo ppid,pid
 PPID   PID
    0     1
    0     2
    2     3
    2     6
    2     7
    2     8
    2    10
    2    12
    2    13
```

This output is piped into *sed* (*s*tream *ed*itor), and the empty space between the numbers is replaced with an arrow "->":

```
~ > ps axo ppid,pid | sed "s/\b / -> /g"
 PPID ->   PID
    0 ->     1
    0 ->     2
    2 ->     3
    2 ->     6
    2 ->     7
    2 ->     8
    2 ->    10
    2 ->    12
    2 ->    13
...
```

PPID is Parent Process Id, and PID is just Process Id. Finally, I use _grep -v "PID"_ to let all the lines through that don't contain "PID". This selects those lines that are actual process relations.

In this case, it just chops off the first line. Next, I wanted to convert this into a file that I can feed into [GraphViz](http://www.graphviz.org/), an open source graph visualization tool. The format is pretty simple, an example is in order:

```
digraph Foo {
  1 -> 2
  1 -> 3
}
```

The above file defines a graph called "Foo" that has three nodes and two edges, it looks like this:

{% img /images/blogimg/Foo.png %}

Now, all we have to do to the PPID->PID output above is to wrap it in braces and prepend two words to the beginning.

We can use _echo "digraph proc { SOME COMMAND }"_ to wrap the output of our command, then dump the results in a file.

```sh
echo "digraph proc { `ps axo ppid,pid | sed "s/\b / -> /g" | grep -v "PID"` } " >> proc.dot
```

Finally, GraphViz has several commands for rendering graphs in various ways. The first thing I tried was a symmetric layout, but that produced a hierarchical, *very wide* image. So I tryed *circo* which produces a radial layout:

``` sh
~ > echo "digraph proc { `ps axo ppid,pid | sed "s/\b / -> /g" | grep -v "PID"` } " >> proc.dot
~ > circo proc.dot -Tpng >> radial_proc.png
```

Here's the radial layout:
{% img /images/blogimg/radial_proc.png %}

You can see the original ancestor of all processes, _sched_ with PID 0 right in the center, then PID 1 which is called _init_ has a bunch of children. I am writing this post in vim in a bash shell in a gnome terminal emulator, the vim PID is 14819, but it is hard to see in this image, there is too much overlap.

Fortunately, we can modify the proc.dot file and include _overlap=false_ right above the PPID->PID pairs. Also, I found from the man pages for the graphviz tools that the _splines=true_ option will draw the edges as splines (curves) instead of straight lines. Also, instead of using _circo_, there is another tool called _neato_ that will render a more symmetrical graph than circo.

This rendering took *much* longer than circo rendering, but is much nicer (click to enlarge):

<a href="/images/blogimg/sym_proc.png">
  <img src="/images/blogimg/sym_proc.png">
</a>

I remember learning in my C programming class that Unix processes all had to be made with fork. It reminded me of asexual reproduction where two identical copies are made. I look forward to learning more about the Unix process model, and recommend Jesse's book.
