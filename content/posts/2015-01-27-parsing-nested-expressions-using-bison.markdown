---
categories:
- parsing
- bison
- grammars
comments: true
date: 2015-01-27T00:00:00Z
title: Parsing nested expressions using Bison
url: /2015/01/27/parsing-nested-expressions-using-bison/
---

I modified my [tipcalc](/blog/2015/01/22/tip-calculation-using-bison-grammar/) program to handle expressions of arbitrary depth, so now it can handle input like `((($100 + 2%) + 2%) - 3%) + 3.5%`.

The trick was to change the `start` symbol to match `binary_expression`, and then define `binary_expression` recursively, like so:

```
binary_expression:
    dollars OP_PLUS percentage
    |
    dollars OP_MINUS percentage
    |
    LPAREN binary_expression RPAREN OP_PLUS percentage
    |
    LPAREN binary_expression RPAREN OP_MINUS percentage
```

This is what makes this new version a context-free grammar and not a regular grammar. Now, if you think that you could still handle this input with a regular expression, notice that adding percentages is not associative. For example, you might think we could drop the parens and just parse `$100 + 2% + 2% + 2%` using `/\$\d+ (\+ \d\%)+/`

```
    \$\d+ (\+ \d\%)+
```

![Regular expression visualization](https://www.debuggex.com/i/EaZiAO8PWJosT0b_.png)

[Debuggex Demo](https://www.debuggex.com/r/EaZiAO8PWJosT0b_)

However, if instead we wrote `$100 + 2% - 2% + 2%`, associativity says we can reduce it to `$100 + 2%`, however, when associated to the left `(($100 + 2%) - 2%) + 2%` it is clear that the result is different from `$100 + 2%`.
