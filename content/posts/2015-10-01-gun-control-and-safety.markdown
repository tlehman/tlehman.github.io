---
categories:
- death
- statistics
- politics
- guns
- law
comments: true
date: 2015-10-01T00:00:00Z
title: Gun control and safety
url: /2015/10/01/gun-control-and-safety/
---

Another mass shooting happened today. I don't usually write about this, but it happened in Roseberg, Oregon, close to where I live. Too close. I do understand that it is morally equivalent to a mass shooting in Ethiopia, Indonesia, the Netherlands or Australia, but something about events being close by have a bigger emotional impact.

The question I want to address in this article is whether legislation can help solve this problem. I'll focus on whether it is effective to implement barriers to gun ownership.

The inspiration for this article is this graphic by Libby Isenstein:

![Libby Isenstein's infographic on guns](https://pbs.twimg.com/media/COF4FxPUkAEmOkI.jpg)

My methodology is to see if there is a correlation between the number of gun-control-related laws in a state and the number of gun-related deaths. The columns in the above table will each count for up to one point. For example, if a state doesn't require a permit for a gun, it gets 0, and if it does require a permit, it gets 1. For columns related to the difficulty of getting a gun, easy gets 0 points, moderate gets 0.5 points, and difficult gets 1 point.

These points are then added up, and we look at all the states (plus DC), as pairs `(sum of points, gun deaths per 100,000 people)`

![scatterplot](/images/blogimg/guns_output_6_1.png)

This has a correlation coefficient of 0.52 (1.0 being a perfect fit), what that means is that there is a moderate trend between the degree of gun control and the number of gun-related deaths. It doesn't prove that gun control laws cause fewer gun deaths, but it is at least consistent with that claim. And more importantly, it is evidence against the argument that more widespead access to guns make us all safer.

No person should die for no reason. If legislation can help solve this problem (there's reason to think it can), then it's our duty to make that come to pass. Unfortunately, certain interpretations of the Second Amendment currently in force have prevented many sane limits on access to guns, this article by [John Paul Stevens in the Washington Post explain a little history behind that](https://www.washingtonpost.com/opinions/the-five-extra-words-that-can-fix-the-second-amendment/2014/04/11/f8a19578-b8fa-11e3-96ae-f2c36d2b1245_story.html?postshare=2541443818572894).

For more detail on how to perform the analysis above, see below (requires familiarity with python, or a similar language).


```
import pandas as pd
import numpy as np
df = pd.read_csv("guns.csv")
df.head()
```



<div>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>deaths</th>
      <th>state</th>
      <th>laws</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>2.6</td>
      <td>HI</td>
      <td>7.0</td>
    </tr>
    <tr>
      <th>1</th>
      <td>3.1</td>
      <td>MA</td>
      <td>5.0</td>
    </tr>
    <tr>
      <th>2</th>
      <td>4.2</td>
      <td>NY</td>
      <td>6.0</td>
    </tr>
    <tr>
      <th>3</th>
      <td>4.4</td>
      <td>CT</td>
      <td>4.5</td>
    </tr>
    <tr>
      <th>4</th>
      <td>5.3</td>
      <td>RI</td>
      <td>4.5</td>
    </tr>
  </tbody>
</table>
</div>




```python
import matplotlib.pyplot as plt
%matplotlib inline
plt.ylabel("gun deaths per 100k")
plt.xlabel("number of gun laws")
plt.scatter(df["laws"], df["deaths"])
```




    <matplotlib.collections.PathCollection at 0x10d678850>




![png](/images/blogimg/guns_output_3_1.png)


Since it looks like a downward trend, let's see how well a linear model fits this data.


<pre><code>
from sklearn import linear_model
reg = linear_model.LinearRegression() 
X = df["laws"].values.reshape((len(df),1))
y_true = df["deaths"].values.reshape((len(df),1))

reg.fit(X,y_true)
y_pred = reg.predict(X)
</code></pre>


```python
plt.ylabel("gun deaths per 100k")
plt.xlabel("number of gun laws")
plt.plot(X,y_pred)
plt.scatter(X,y_true)
```




    <matplotlib.collections.PathCollection at 0x10e980fd0>




![png](/images/blogimg/guns_output_6_1.png)


It looks like a really good, fit, but to make it precist, we should find the $R^2$ score.


```python
from sklearn.metrics import r2_score
r2_score(y_true, y_pred)
```




    0.52124939556633598





