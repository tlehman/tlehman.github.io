---
categories:
- ssl
- tls
- web
- email
- cryptography
- privacy
- decentralization
comments: true
date: 2016-01-07T00:00:00Z
title: Set up Mailinabox with LetsEncrypt
url: /blog/2016/01/07/set-up-mailinabox-with-letsencrypt/
---

If you are not familiar with the [EFF](https://eff.org) or their great project [LetsEncrypt](https://letsencrypt.org),
don't feel bad, even the [CEO of T-Mobile doesn't know](http://techcrunch.com/2016/01/07/who-the-f-is-the-eff-john-legere-wants-to-know/).

But seriously, this post is about combining the best of two projects:

 - [Mailinabox](https://mailinabox.email/) a standalone mail server that enables email as it should be
 - [LetsEncrypt](https://letsencrypt.org) a non-profit TLS certificate authority

Mailinabox allows anyone with little patience to set up their own mail server with all the fixings, web client, 
spam filter, admin panel, etc. I recently just set it up, you can send email to ![mail at this domain](/images/email_address.png) to contact me.

Once you set up a domain name and a server and then get Mailinabox running, the next step is to get LetsEncrypt working.

Since Mailinabox aims to automate almost everything, it is important to symlink the generated LetsEncrypt certificates to right place so Mailinabox knows where to find them.

The directory `/home/user-data/ssl` is created by Mailinabox, and to use LetsEncrypt certificates there, you will have to symlink them to that directory.

I started by turning off nginx and running:

```
$ /letsencrypt-auto certonly --standalone -d tobilehman.com -d www.tobilehman.com
```

That generated the following files in `/etc/letsencrypt/live/tobilehman.com/`:

- cert.pem
- chain.pem
- fullchain.pem
- privkey.pem

To use these in Mailinabox, you need to mkdir the directories under `/home/user-data/ssl/`:

```
$ mkdir /home/user-data/ssl/tobilehman.com
$ mkdir /home/user-data/ssl/www.tobilehman.com
```

Then symlink the `ssl_certificate.pem` and `privkey.pem` files to the right place:

```
$ ln -s /etc/letsencrypt/live/tobilehman.com/fullchain.pem /home/user-data/ssl/tobilehman.com/ssl_certificate.pem
$ ln -s /etc/letsencrypt/live/tobilehman.com/privkey.pem /home/user-data/ssl/tobilehman.com/ssl_private_key.pem

$ ln -s /etc/letsencrypt/live/tobilehman.com/fullchain.pem /home/user-data/ssl/www.tobilehman.com/ssl_certificate.pem
$ ln -s /etc/letsencrypt/live/tobilehman.com/privkey.pem /home/user-data/ssl/www.tobilehman.com/ssl_private_key.pem
```

And then finally, go to the directory that contains the mailinabox repository folder, and 
run `mailinabox/tools/web_update`, and then start nginx up again. You should be good to go! If not, email me with 
some context, and we can figure out a solution.
