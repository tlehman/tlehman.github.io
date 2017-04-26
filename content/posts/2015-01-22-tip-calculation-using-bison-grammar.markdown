---
categories:
- parsing
- bison
- C
- programming
comments: true
date: 2015-01-22T00:00:00Z
title: Tip calculation using Bison grammar
url: /blog/2015/01/22/tip-calculation-using-bison-grammar/
---

As long as I've been able to do arithmetic, I've been able to figure out calculating taxes and tips, it's easy. Given a 
dollar value $17.91 we can figure out the total with a tip of 18% as $17.91*(1.18) = $21.14

However, it would be nice just to enter in `$17.91 + 18%` and have the computer figure it out. So one time at lunch after 
calculating the tip for a burrito I decided to learn lex and bison, which can be used together to create a mini language.

The grammar I used was the following:

```
start:
    dollars OP_PLUS percentage
    |
    dollars OP_MINUS percentage

dollars:
    TOKDOLLAR NUMBER

percentage:
    NUMBER TOKPERCENT
```

Where `OP_PLUS` and `OP_MINUS` come from `+` and `-`. Also, `TOKDOLLAR` and `TOKPERCENT` are `$` and `%`.

Then, below each grammar rule, I added some C code that would be generated if the input matches that rule:

```
start:
    dollars OP_PLUS percentage
    {
        double dollars = $1;
        double percentage = ($3)/(100.0);
        double total = dollars + dollars*percentage;
        printf("$%.2f", total);
    }
    |
    dollars OP_MINUS percentage
    {
        double dollars = $1;
        double percentage = ($3)/(100.0);
        double total = dollars - dollars*percentage;
        printf("$%.2f", total);
    }
```

The full source code is available [here](https://github.com/tlehman/tipcalc).

Now, it is true that this is no more powerful than a regular expression, however, 
I intend on modifying it to allow nested expressions like `(($2 + 4%) + 4%)`, which 
would be useful for compound interest calculations. That would be more powerful than 
regular expressions, meaning it would be at least a [context-free grammar](https://en.wikipedia.org/wiki/Context-free_grammar).

*Update: [In the future, I wrote about implementing this](/blog/2015/01/27/parsing-nested-expressions-using-bison)*
