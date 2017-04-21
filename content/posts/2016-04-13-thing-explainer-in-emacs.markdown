---
categories:
- xkcd
- no-bullshit
comments: true
date: 2016-04-13T00:00:00Z
title: Thing explainer in emacs
url: /2016/04/13/thing-explainer-in-emacs/
---

[This](https://github.com/tlehman/etc/blob/master/common-words.el) is my first [major mode](https://www.gnu.org/software/emacs/manual/html_node/emacs/Major-Modes.html) for emacs. 
It was inspired by Randall Munroe's [Thing Explainer](https://xkcd.com/thing-explainer/) and Morten Just's [editor that 
doomed humanity](https://medium.com/@mortenjust/i-doomed-mankind-with-a-free-text-editor-ba6003319681#.utnh5bpjh).

The concept is simple, restrict your vocabulary to the 1000 most common words. If you can explain something using this 
reduced vocabulary, then you really understand the topic. This is a decent test of understanding because it's easy to 
learn a word, and even use that word in the right context, but still have no idea how it relates to other things.

This is not to say that specialized vocabulary is bad, it's quite useful for communicating between people with a lot of 
shared context. But when explaining things to people without that context, it's important to be able to expand jargon words
into common words, even if it results in a larger, slightly less accurate version.

Here is an animation of the editor mode in action:

<img src="/images/blogimg/common-word-mode.gif">

