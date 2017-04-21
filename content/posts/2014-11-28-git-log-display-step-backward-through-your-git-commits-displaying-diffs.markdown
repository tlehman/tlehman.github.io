---
categories:
- command-line
- git
comments: true
date: 2014-11-28T00:00:00Z
title: 'git log-display: step backward through your git commits displaying diffs'
url: /2014/11/28/git-log-display-step-backward-through-your-git-commits-displaying-diffs/
---

When working with git at the command line, I frequently want to see the last changes made to a repository. To see the result of the last commit (diff'd with it's parent commit), you can just type `git show`. Git assumes the `HEAD` pointer and just spits it out:

``` diff
$ git show
commit 112379bca37e89c719c54be1598eeea5dbeede82
Author: Tobi Lehman <tlehman@example.com>
Date:   Thu Nov 20 10:31:59 2014 -0800

    add -r flag to regenerate fastroutes file

diff --git a/fastroutes b/fastroutes
index 55920ce..666a2ab 100755
--- a/fastroutes
+++ b/fastroutes
@@ -39,6 +39,10 @@ function main {
 if [[ "$1" == "-f" ]]
 then
   show_current_filename
+elif [[ "$1" == "-r" ]]
+then
+  rm $cached_routes_filename
+  cache_routes
 else
   main
 fi
```

Sometimes I want to step back through all the commits though, I can run `git show HEAD^` and `git show HEAD^^`, and keep appending `^` characters, but that gets old fast. Also, sometimes I just want to look at the commits that changed a file.

To solve this, I wrote [git log-display](https://github.com/tlehman/bin/blob/master/git-log-display). Here's an example to see how it can be used:

### git log-display

To see all the commits from HEAD all the way back to initial commit, run `git log-display`:

<img src="/images/blogimg/git-log-display.gif">

To step back through commits, hit 'q', and to exit press 'Ctrl-C'

### git log-display FILENAME

To see all the commits that make modifications to `FILENAME`, just run `git log-display $FILENAME`:

<img src="/images/blogimg/git-log-display-filename.gif">

### git subcommands

One nice thing about git is that you can make a subcommand `git foo` just by having an executable called `git-foo` somewhere in your `PATH` variable. So to install this, just copy `git-log-display` to a directory in your `PATH`. 


