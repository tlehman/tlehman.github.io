---
categories:
- freedom
- authentication
- standards
comments: true
date: 2013-09-16T00:00:00Z
title: Replacing MyOpenID, keeping Federated Identity
url: /2013/09/16/replacing-myopenid-keeping-federated-identity/
---

For those unfamiliar with OpenID, [Jeff Atwood at Coding Horror has a nice description of OpenID](http://www.codinghorror.com/blog/2008/05/openid-does-the-world-really-need-yet-another-username-and-password.html), it's benefits, drawbacks and user experience.

For as long as I've been using OpenID, I've used [JanRain's MyOpenID service](https://www.myopenid.com/), but recently they announced that the service is being shut down. As a response to this, the folks at [IndieAuth](https://indieauth.com/) decided to get together and add OpenID support to their service and create a viable replacement for MyOpenID.

Here's a concise [how-to on setting up your personal site to be an OpenID delegate](http://peat.org/2013/09/15/replacing-myopenid/), using IndieAuth as the OpenID provider, and other services such as Github, Twitter, Google, etc. to provide proofs of identity. It allows you to use your personal URL as your username on OpenID-compliant web services.

Here are some of the sites that currently support OpenID:

* [Slashdot](http://slashdot.org/)
* [Gitorious](https://gitorious.org/login?method=openid)
* [Source Forge](http://sourceforge.net/)
* [Stack Overflow](http://stackoverflow.com/)
* [Status.net](http://status.net/)
* [Open Source Bridge wiki](http://opensourcebridge.org/wiki/Main_Page)
* [OpenStreetMap](http://openstreetmap.org/)

The [Indie Web Camp wiki has a list that is kept up to date](http://indiewebcamp.com/OpenID).

The reason you should care about OpenID is that it is a good way to own your identity, you can use a domain that you control to represent yourself, this is in line with the [1st principle of the independent web](http://indiewebcamp.com/principles). If you are uncomfortable using [https://indieauth.com](https://indieauth.com), the [source code is Apache licensed and on GitHub](https://github.com/aaronpk/indieauth), you can read through it, tweak it, and set it up on your own server. It is just a tool to enable you to authenticate on _your terms_, not those of some other company or organization.

