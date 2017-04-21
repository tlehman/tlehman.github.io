---
categories:
- command-line
- bash
comments: true
date: 2013-10-19T00:00:00Z
title: Revisiting spaces in file names
url: /2013/10/19/revisiting-spaces-in-file-names/
---

I don't like spaces in file names, as I've [written before](/blog/2012/10/29/spaces-in-filenames/), and as I've [tried in vain to fix](/blog/2012/11/19/fixing-spaces-in-filenames/).

I've been working around this issue with a little hack that I call `wrap`:

``` bash
#!/bin/sh
# Read in lines, output lines with single quotes around them
#
# Example use:
# 
#   $ <command>
#   output of command
#   the output has spaces
#   spaces are annoying
#
#   $ <command> | wrap
#   'output of command'
#   'the output has spaces'
#   'spaces are annoying'
#

sed -e "s/\(.*\)/'\1'/"
```

It wraps each line with single quotes, however, the obvious problem with this is that sometimes lines have single quotes in them. For file names, it's usually fine, since it's unusual for file names to have quotes in them.

I recently came across [this awesome solution](https://coderwall.com/p/lhilrq) by [@debona](https://coderwall.com/debona), 
it uses the [IFS](http://nixshell.wordpress.com/2007/09/26/ifs-internal-field-separator/) environment variable. IFS stands for Internal Field Separator.

Here's the problem I run into when looping over a list file files that have spaces in the name:

``` bash
$ find ~/Library/Saved\ Application\ State | head -5 | for file in $(cat -); do echo $file; done

/Users/tlehman/Library/Saved
Application
State
/Users/tlehman/Library/Saved
Application
State/com.adobe.Reader.savedState
/Users/tlehman/Library/Saved
Application
State/com.adobe.Reader.savedState/data.data
/Users/tlehman/Library/Saved
Application
State/com.adobe.Reader.savedState/window_2.data
/Users/tlehman/Library/Saved
Application
State/com.adobe.Reader.savedState/windows.plist

```

The spaces are seen as delimiters, but by setting IFS to a newline, we can avoid this problem:

``` bash
$ IFS='
'
$ find ~/Library/Saved\ Application\ State | head -5 | for file in $(cat -); do echo $file; done
/Users/tlehman/Library/Saved Application State
/Users/tlehman/Library/Saved Application State/com.adobe.Reader.savedState
/Users/tlehman/Library/Saved Application State/com.adobe.Reader.savedState/data.data
/Users/tlehman/Library/Saved Application State/com.adobe.Reader.savedState/window_2.data
/Users/tlehman/Library/Saved Application State/com.adobe.Reader.savedState/windows.plist
```

This is just the kind of solution I was looking for, props to @debona for writing this up on Coderwall. 

