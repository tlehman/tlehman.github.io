---
categories:
- ssl
- web
- cryptography
- security
comments: true
date: 2015-11-11T00:00:00Z
title: How to set up LetsEncrypt (free SSL/TLS certs)
url: /2015/11/11/how-to-set-up-letsencrypt-free-ssl-slash-tls-certs/
---

First, for those who don't know what LetsEncrypt is, it is a project by the [EFF](https://www.eff.org/) to create a legitimate certificate authority that doesn't charge. Up until now, certificate authorities charged, creating a financial barrier for many to use SSL/TLS to secure their site. It's true that the prices weren't unreasonable, but it's just enough to prevent many people from choosing to reap the benefits of encryption. As far back as 2012, Jeff Atwood argued in a [blog post](http://blog.codinghorror.com/should-all-web-traffic-be-encrypted/) that we should make SSL default for web pages, but acknowledged that it would take a while for it to be the default:

> Maybe not tomorrow, maybe not next year, but over the medium to long term, adopting encrypted web connections as a standard for logged-in users is the healthiest direction for the future of the web. We need to work toward making HTTPS easier, faster, and most of all, the default for logged in users.

Now that LetsEncrypt has entered a limited beta stage, anyone who applied and got accepted can get free certificates, and only has to follow a few easy steps:

1. ssh into your webserver
2. stop your web server program (nginx, apache, etc.)
3. clone the letsencrypt git repo: `git clone https://github.com/letsencrypt/letsencrypt`
4. cd into `letsencrypt/`
5. run the command: `./letsencrypt-auto --agree-dev-preview --server https://acme-v01.api.letsencrypt.org/directory auth`
6. set up your certificate and private key with your web server

## How to set up the generated certificates with your web server

I've had to do this with Apache2 and nginx, and both times I couldn't find good documentation, so here's what worked for me:

### Apache2

In the Apache config file for the website that is for your approved LetsEncrypt domain (tobilehman.com in my case), `/etc/apache2/sites-enabled/tobilehman.com.conf`, just add:

```
<VirtualHost *:443>
     SSLEngine On
     SSLCertificateFile /etc/letsencrypt/live/tobilehman.com/cert.pem
     SSLCertificateKeyFile /etc/letsencrypt/live/tobilehman.com/privkey.pem
     SSLCertificateChainFile /etc/letsencrypt/live/tobilehman.com/chain.pem

     ServerAdmin examplemail@example.com
     ServerName tobilehman.com
     ServerAlias www.tobilehman.com
     DocumentRoot /var/www/tobilehman.com/public_html/
     ErrorLog /var/www/tobilehman.com/logs/error.log
     CustomLog /var/www/tobilehman.com/logs/access.log combined
</VirtualHost>
```

Where you replace `tobilehman.com` with your domain name, and add your email for `ServerAdmin` too.


### nginx

In the nginx config file for the website that is for your approved LetsEncrypt domain (goga.me in my case), `/etc/nginx/nginx.conf`, just add to following to the `http` section:

```
server {
        listen 443;
        ssl on;

        ssl_certificate /etc/letsencrypt/live/goga.me/cert.pem;
        ssl_certificate_key /etc/letsencrypt/live/goga.me/privkey.pem;
        location / {
                proxy_pass http://127.0.0.1:8080;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_read_timeout 3600;
                proxy_send_timeout 3600;
        }
        root /home/rails/goga.me;
}
```

Where you replace `goga.me` with your domain name.

LetsEncrypt is just the beginning, but it's a great practical first step towards a web that is SSL by default. Even for public content that doesn't need the benefits of encryption, the integrity you get from SSL is worth it. If you are unfamiliar, this is the property of an SSL connection that you know that the page is from someone who controls the private key. To illustrate this, imagine that you visited `http://tobilehman.com`, and that your router had some malware that redirected the HTTP request to an evil server that returned a fake tobilehman.com, if the connection was instead to `https://tobilehman.com`, then any attempt to redirect that request to another evil server would be a dead giveaway, since that evil server can't prove that it has access to the private key that is associated with `https://tobilehman.com`. This alone is reason enough to use SSL everywhere, all the time. For everything. Even if securing the information from prying eyes isn't a goal, the authenticity of the source is worth proving.

The EFF is a great organization, and if you can, donate to them. And sign up for LetsEncrypt, encrypt all the things.
