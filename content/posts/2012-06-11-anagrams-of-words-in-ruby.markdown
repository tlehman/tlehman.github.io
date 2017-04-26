---
categories:
- ruby
- permutation
- code
comments: true
date: 2012-06-11T00:00:00Z
title: Anagrams of words in ruby
url: /blog/2012/06/11/anagrams-of-words-in-ruby/
---

One thing that is nice about Ruby is the ability it gives you to peel open a class and stick new methods into an object or class while the program is running. As an example, we will use the Array#permutation method to implement an anagram method for any string. We start by opening up the class: 
``` ruby
class String
  def anagram
    self.split(//).permutation.map { |a| a.join }
  end
end
```
self.split(//) just splits the string into an array of characters, then permutation returns the list of all permutations, and finally, the map { |a| a.join } expression just takes all permutations and joins the permuted characters into strings.

Now, we can take a string such as “not” and call "not".anagram, the output is then ["not", "nto", "ont", "otn", "tno", "ton"].
