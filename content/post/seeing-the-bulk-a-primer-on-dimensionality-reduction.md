+++
title = "Seeing the bulk: a primer on dimensionality reduction"
categories = ["datavis", "machine-learning", "math"]
date = "2017-04-12"

+++

If you haven't seen Interstellar, you might not get the reference in the title. Don't sweat it, [the bulk beings](http://interstellarfilm.wikia.com/wiki/Bulk_Beings) are some advanced civilization that is able to move outside the familiar 3D space that we are stuck in. A similar plot device was used in Edwin Abbott's book Flatland.

Outside of entertainment, there is a lot of value in attempting to understand high dimensional spaces. Physics, machine learning, engineering control systems all make use of higher-dimensional spaces in one way or another.

In this post we will learn how datasets can be thought of as sets of points in a high dimensional space, and then we will learn how to map those sets into low (2 or 3)-dimensional spaces so that we can see them. The goal will be to preserve as much structure as possible, but still fit everything into a space we can see and feel.

Let's start with 1D, real numbers are points on a line, easy. In 2D, we can use a pair (x,y) to name any point in a plane. For 3D, we can use triplets (x,y,z) to name points in a space like the one we physically live in.

If we wanted to name the four corners of a tetrahedron, 

|  x |  y |  z |
|----|----|----|
|  1 |  1 |  1 |
| -1 | -1 |  1 |
| -1 |  1 | -1 |
|  1 | -1 | -1 |



```
def sum(a, b):
    return a+b
```
