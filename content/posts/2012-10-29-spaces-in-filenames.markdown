---
categories:
- opinion
- command-line
comments: true
date: 2012-10-29T00:00:00Z
title: Spaces in filenames
url: /2012/10/29/spaces-in-filenames/
---

I don't like spaces in filenames. This trend started when I started playing with the command line on Linux 
back when I was about 13. Working with the shell, each space had to be escaped, which is just enough of an 
annoyance to warrant avoiding spaces altogether as a basic principle. 

I got to thinking about this recently when I tried to find out how I could get rid of the space in the name 
of my Google Drive directory. I use both Dropbox and Google Drive, and as a package, I prefer Dropbox because 
of their out-of-the-box Linux support. However, Google Drive allows for a smaller per-month charge, and at the 
time of this post, the cost per byte is about the same between the two. Also, when you install Dropbox, you 
don't have a stupid space in the middle of the directory name!

Out of curiosity, I did a little experiment to find out how steadfastly I had been applying my own principle:

``` bash
~ > find Dropbox | wc -l
    9909
~ > find Dropbox | grep " " | wc -l
     834
~ > python -c "print(834.0/9909.0)"
0.084165909779
```

So, 8.4% of my file and directory names have spaces in them. Apparently, my four years of dropbox usage have 
been rather unprincipled.

Performing the same experiment on the Google Drive directory requires an extra step, since "Google Drive" is 
the name of the root directory, I had to shave off that part using sed:

``` bash 
~ > find Google\ Drive | sed 's/Google Drive\///g' | wc -l
    2263
~ > find Google\ Drive | sed 's/Google Drive\///g' | grep " " | wc -l
      68
~ > python -c "print(68.0/2263.0)"
0.0300486080424
```

So, correcting for the root directory's name, only 3% of the stuff in my Google Drive have spaces in the name.

In practice, I only follow this principle about 92-97% of the time, I can improve on that with a simple script, 
once I have it made, I'll post it for others who agree about how files should be named.
