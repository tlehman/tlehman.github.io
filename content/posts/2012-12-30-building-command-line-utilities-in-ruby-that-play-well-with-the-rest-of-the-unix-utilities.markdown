---
categories:
- command-line
- unix
- programming
- ruby
comments: true
date: 2012-12-30T00:00:00Z
title: Building command line utilities in Ruby that play well with Unix
url: /blog/2012/12/30/building-command-line-utilities-in-ruby-that-play-well-with-the-rest-of-the-unix-utilities/
---

The [Unix pipeline](http://en.wikipedia.org/wiki/Pipeline_%28Unix%29) is a beautiful thing, as long as Standard Input and Standard Output are handled correctly, programs can be kept small and predictable. Getting any sort of complex functionality is simply a matter of composing the appropriate command line utilties via the Unix pipeline.

When taking [Coursera's Cryptography I class](https://www.coursera.org/course/crypto), I learned about how all substitution ciphers could be cracked using character frequency analysis. Basically, in English plaintext, there is a very non-uniform distribution over the alphabet, as you can see here: 

{% img http://upload.wikimedia.org/wikipedia/commons/b/b0/English_letter_frequency_%28frequency%29.svg r%}

Using this, no matter how you scramble up the alphabet, given enough ciphertext, you can use this distribution to figure out how the alphabet was scrambled.

As I learned this, I wanted to test it on real data sets like Sherlock Holmes and Beowulf. There was a lot of English text, so I looked around for a command line utility that counted character or word frequency. I couldn't find one, so I whipped together a ruby program.

Aside from substitution ciphers, I like knowing word and character frequencies for other reasons, and I was a bit annoyed that such a thing didn't exist, so I made one. Since I've been doing Ruby development for about a year, I thought it was about time to learn how ruby gems are born.

Buildling a gem is very easy, one just has to run

``` bash
> bundle gem foo
      create  foo/Gemfile
      create  foo/Rakefile
      create  foo/LICENSE.txt
      create  foo/README.md
      create  foo/.gitignore
      create  foo/foo.gemspec
      create  foo/lib/foo.rb
      create  foo/lib/foo/version.rb
Initializating git repo in /Users/tobi/foo
```

Then, cd into the `foo` directory, hack away on the code, and then do a `rake release`, which publishes to rubygems.org. Then, anyone else can just run `gem install foo` and start using your program.

I wrote a gem called wordfreq that computed the word or character frequencies (if the -c flag was given), this was a quick way to verify the distribution above for the alphabet.

The thing I got hung up on was the Errno::EPIPE exception in Ruby. When I wrote wordfreq and then piped its output to `head`, the Errno::EPIPE exception was thrown. I thought I was doing something wrong, but it turned out that I just needed to handle that exception, since utilities like `head` and `tail` stop reading after 10 lines. When `head` or `tail` stops reading, Ruby throws an Errno::EPIPE exception. The way I solved the problem was to handle the Errno::EPIPE exception by breaking out of the main loop.

Here is the github repository with the source code and documentation: [https://github.com/tlehman/wordfreq](https://github.com/tlehman/wordfreq), or if you want to start using it, just run 

```
gem install wordfreq
```

Publishing gems is very easy with Bundler, and it is a great way to make small command line utilities. But make sure you respond appropriately when pipes close, that way your command lime tool will mesh nicely with the rest of the Unix tools.

## Further Reading:

 - [Writing Ruby Scripts That Respect Pipelines (J. Storimer)](http://jstorimer.com/2011/12/12/writing-ruby-scripts-that-respect-pipelines.html)
 - [Speaking Unix: Peering into Pipes (M. Streicher)](http://www.ibm.com/developerworks/aix/library/au-spunix_pipeviewer/)
