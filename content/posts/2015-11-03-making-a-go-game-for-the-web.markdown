---
categories:
- game
- ruby
- rails
- javascript
- programming
- web
- svg
- websockets
- algorithms
comments: true
date: 2015-11-03T00:00:00Z
title: Making a Go Game for the Web
url: /blog/2015/11/03/making-a-go-game-for-the-web/
---

I've been feeling productive in the last few weeks. I just finished two Coursera classes, one in machine learning and one in Swift programming. I also finished my minimum viable go game: [goga.me](http://goga.me). And we are working on a really exciting feature at work. I really like having lots of interesting things to work on. Anyway, enough feelings, you came here for games and code.

The game of Go is ancient, it has very few rules, but an unfathomable level of complexity emerges from all the possible ways the pieces can be put on the board. The graphics were very straightforward to implement, it's just a square grid with some colored circles, I don't usually work with graphics, so I experimented with some different web technologies to see what worked best.

![example go game](/images/blogimg/gogame_screenshot_0.png)

## Attempt 1, HTML5 Canvas

About a year ago I wrote a Go board using the HTML5 &lt;canvas&gt; element, [here's the source code](https://github.com/tlehman/go-websocket/blob/master/go_game.js), it doesn't actually have a server side, I decided to ditch that approach, since canvas is really great for making arbitrarily complicated bitmap graphics, but I needed something much simpler. Also, when zooming in on a phone, the click event location was not the same as the location where the code drew a new piece.

## Attempt 2, SVG

After almost a year I came back to the project, I wrote out a rails backend for the data storage and game logic, and then learned SVG (Scalable Vector Graphics). Here's [the source code](https://github.com/tlehman/goga.me/blob/b585f4dec45d726615d73fca301c261d2df17167/app/views/matches/show.html.erb), what I like about SVG is that I can make the board positions part of the [DOM](https://en.wikipedia.org/wiki/Document_Object_Model) and bind javascript events to the positions. This solves a problem with zooming, so that when I zoom in on a phone, the click event shows up in the right position.


## WebSockets, enabling live back and forth gameplay

Another exciting technology that I spent some time learning about was [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API), this allows two players to open a direct connection to one another, so that as soon as someone plays a piece, the other one knows. This way, the user does not have to refresh, it's all live. I used the websockets-rails library to handle setting up a user-to-user connection through the rails backend. The [source code to handle binding and triggering is here](https://github.com/tlehman/goga.me/blob/master/app/views/matches/show.html.erb#L67-L80). To see it in action, [make an account at goga.me](http://goga.me/users/sign_up), and then [create a match](http://goga.me/matches/new), and click 'Start Match', that will start a match against yourself, you can open it up on multiple devices, and when you start playing, the other screen will immediately update, it's pretty cool!

## Other challenges

After getting the graphics and networking to work correctly, the only other major challenge was handling capturing. Capturing is where one color completely surrounds the other color, and the surrounded pieces get removed, you can see it in the following screen capture:

![example capturing in a go game](/images/blogimg/gogame_capturing.gif)

The challenge is to determine the parts of the board that are connected. Since each piece can only be connected to it's four neighboring pieces of the same color, you can start finding connected components by picking a point and walking to every piece connected to it that is the same color. A prime choice for this problem is a breadth first search:

## Breadth First Search

To wrap my head around this algorithm I had to get out my trusty graph theory book. Here's a summary of the algorithm and an example:

**Input**: An unweighted graph and a start vertex u

**Idea**:

 - Maintain a set R of vertices that have been reached but not searched and
 - a set S of vertices that have been searched.
 - The set R is maintained as a First-In First-Out list ([queue](https://en.wikipedia.org/wiki/Queue_%28abstract_data_type%29))

**Initialization**: R = {u}, S = ø, d(u,u) = 0

**Iteration**: As long as R &neq; ø, we search from the first vertex v of R. The neighbors of v not in (S U R) are added to the back of R and then v is removed from the front of R and placed in S.

## Example

Let G be the adjacency graph of the following Go shape: 


       1  2  3  4  5  6
     1    .  o  o  o  .
     2    .  .  .  .  .  <--- black component
     3    .




| v | R | S |
|---|---|---|
| (2,1) | [(2,1)] | {} |
| (2,1) | [(2,2)] | {(2,1)} |
| (2,2) | [(2,3),(3,2)] | {(2,1),(2,2)} |
| (2,3) | [(3,2)] | {(2,1),(2,2),(2,3)} |
| (3,2) | [(4,2)] | {(2,1),(2,2),(2,3),(3,2)} |
| (4,2) | [(5,2)] | {(2,1),(2,2),(2,3),(3,2),(4,2)} |
| (5,2) | [(6,2)] | {(2,1),(2,2),(2,3),(3,2),(4,2),(5,2)} |
| (6,2) | [(6,1)] | {(2,1),(2,2),(2,3),(3,2),(4,2),(5,2),(6,2)} |
| (6,1) | [] | {(2,1),(2,2),(2,3),(3,2),(4,2),(5,2),(6,2),(6,1)} |


<br> <br>

Once I worked through the steps with this example and several others, writing the code to implement it was very straightforward, here's the [javascript version](https://github.com/tlehman/go-websocket/blob/8094890048ca845c0fef416573b8aba533ca6ea9/jasmine/src/ComponentMap.js#L16-L51) and the [ruby version](https://github.com/tlehman/goga.me/blob/b585f4dec45d726615d73fca301c261d2df17167/app/presenters/board_presenter.rb#L24-L41).

My go game is at a good stopping point for now, I still need to fix a few edge cases and add a chat feature. Also, I realized how satisfying it is to take a bunch of stuff I learned and make something real with it. I plan on making a native mobile client to this (iOS and Android), but that will take some more time and work.

