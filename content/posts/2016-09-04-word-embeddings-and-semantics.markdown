---
categories:
- linguistics
- machine-learning
- linear-algebra
- semantics
comments: true
date: 2016-09-04T00:00:00Z
title: word embeddings and semantics
url: /2016/09/04/word-embeddings-and-semantics/
---

Can a machine understand what a word means? Right now machines routinely correct spelling and grammar, but are pretty useless when it comes to semantics.

Search engines are an exception, they have a rudimentary understanding of what words mean. One of the ways this can work is explored in Tomas Mikolov's 2013 paper 
on **word embeddings**. Word embeddings are mappings from sets of words to vectors, such that the distances between the vectors represent the semantic similarity 
of the words. These embeddings are learned by programs by scanning through large volumes of text, such as wikipedia articles and royalty-free books, and uses a 
sliding context to adjust the parameters of the embedding.

The goal is to learn a function `f` from words to vectors such that the following equation holds:

$$ f(\text{waiter}) - f(\text{man}) + f(\text{woman}) = f(\text{waitress}) $$

Using the 'skip-gram' technique in the Mikolov paper, we can get a pretty good function `f`, for details, look at this [tensorflow tutorial](https://www.tensorflow.org/versions/r0.10/tutorials/word2vec/index.html).

I ran the `word2vec_optimized.py` program and generated the word embeddings, and here is a real session from that model:

``` python
>>> model.analogy('man', 'woman', 'waiter')
'waitress'
```

The `word2vec_optimized.py` script ran through all the text, generated the embeddings and then did that calculation up above to find the appropriate analogy. There is a lot more to 
this that I want to explore, but so far it's been surprising how well this works.


# References

- Efficient estimation of word representations in vector space by Tomas Mikolov, Kai Chen, Greg Corrado, Jeffrey Dean (2013) _arXiv preprint arXiv:1301.3781_
