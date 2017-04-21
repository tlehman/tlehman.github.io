---
categories:
- history
- hardward
- modularity
- opinion
comments: true
date: 2013-10-31T00:00:00Z
title: Modular computing forever?
url: /2013/10/31/modular-computing-forever/
---

I remember building my first computer, I was about 14, I ordered my AMD Athlon XP processor, got a motherboard and case, keyboard, monitor, sound card, graphics card, etc. All that. Assembling it was straighforward, but configuring it was a challenge, getting GNU/Linux and Windows 2000 to dual boot, then getting drivers straight, setting up a shared partition for data sharing. It was rewarding to get it all up and running. I upgraded that computer piece by piece, getting a new graphics card, hard drive, keyboard/mouse, RAM, CPU and eventually a new motherboard.

I had that computer all the way through high school and afterward, because the pieces used standard interfaces like PCI, AGP, Socket A, USB etc. I could replace individual components as I needed, without having to buy a whole new system. This was (and in my opinion is) what all hardware should aspire to. I define modularity not only by the ability to swap out components, but also to have components that are interoperable (e.g. my RAM works in an AMD or an Intel box).

To me, it seems obvious that interoperability is ideal. It's good for the consumer, but it makes sense why there are lots of proprietary connectors and non-interoperable devices, because of the following reasons:

  - the standard must exist (e.g. USB, Socket A)
  - the standard must have features that intersect with the goals of the device manufacturer (e.g. USB 2.0 is not fast enough for use with your main hard drive)
  - the manufacturer must comply with the standard

Another problem was explored in [XKCD 927: Standards](http://xkcd.com/927/), there may be a standard, but it's not unique, leading to fragmentation.

Despite these challenges, modular personal computers exist. This ideal of modularity has not been realized very much in the mobile computer space though, tablets and phones are selling like crazy, and they all are more or less out-of-the-box, sealed devices with little hope of swapping out parts. iPhones, iPads, Nexus phones and tablets have difficult to replace batteries (usually voiding a warranty in the process). I've broken an iPhone 4 trying to replace the lock button, this is because the parts are too small. Also, none of the parts are interoperable, I couldn't take a Nexus 4 battery and replace it with an iPhone 5 battery, for example.

_I would like to point out [ifixit.com](http://www.ifixit.com/), they have great tutorials on fixing phones and tablets, and are a remedy to the current situation of devices that are difficult to work on._

I don't want to complain though, I love iPhones, Nexus phones and tablets, they are compact, convenient and very useful for most of non-work related casual computing.

I was naturally very excited to hear about Motorola Ara:

{% img /images/blogimg/moto_ara.jpg %}

It's a project that aims to make a set of modular components that can be combined to build your own phone, and swap out parts as needed!

I thought that this could be the beginning of a golden age of mobile computer interoperability, as consumers would flock to this platform because of the economic benefit of being able to replace parts as needed. I later realized this might be a fantasy, after reading a [good article by Jacob Miller](http://jjcm.org/blog/mac_pros_and_modularity/).

Jacob argues that non-modularity is inevitable, for more than the four reasons I mentioned above, I urge you to read the article, it's very well written and thoughtful, but until then I'll include the quote that for me was an inflection point:

> Despite all these changes in speed, one thing has largely stayed nearly the same. **The physical size of the interconnect is still limited not by our current technology, but by our ability as humans to line up copper connectors**. Right now the lane size for PCI Express is the exact same as it was back in 1993 when PCI was released - 1mm. Contrast that with the lane size in a modern day processor - currently 22nm. Eventually, we're going to hit a limit with the amount of data that any individual lane can transfer (currently at a jaw dropping 1969MB/s with PCI-E v.4), simply because we can only bend the laws of physics so far. At that point, our only option to increase speed is going to be to add more lanes.

> At that point, modularity will begin to fail.

His article clarified a choice that hardware designers and manufacturers have to make, _increase speed and capacity while shrinking the device, or preserve the ability for humans to operate on the parts, and replace them as needed_. On the iPhone side, the former was chosen, on the Motorola Ara side, the latter was chosen, and as a result, Ara phones will necessarily be bigger.

As parts get smaller, the very ability for us humans to swap out those parts diminishes. Devices like the iPhone 4 and 5 are so compact that it's just really hard to even get to the parts. This trend is likely to continue, and the preference for smaller devices may lead to the failure of Project Ara.

I am going to give Ara a try, and I hope that it succeeds, but I no longer believe everyone will flock to it, because Apple, LG and Samsung will keep making smaller and smaller devices that sacrifice modularity.
