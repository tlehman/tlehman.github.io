---
categories:
- command-line
- bash
- unix
comments: true
date: 2012-11-19T00:00:00Z
title: Fixing spaces in filenames
url: /2012/11/19/fixing-spaces-in-filenames/
---

Sorry this has taken so long, I've been working on the [Cryptography Coursera class](https://www.coursera.org/course/crypto), 
to get rid of all spaces in all files below the current directory, the following bash script will do:

``` bash
for filename in $(find .); do
  newfilename=$(echo $filename | sed 's/ /_/g'); 
  mv $filename $newfilename
done
```
