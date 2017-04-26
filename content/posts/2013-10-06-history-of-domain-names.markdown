---
categories:
- history
- networking
- computing
- standards
- mathematics
comments: true
date: 2013-10-06T00:00:00Z
title: History of Domain Names
url: /blog/2013/10/06/history-of-domain-names/
---

In trying to understand [DNS](https://en.wikipedia.org/wiki/Domain_Name_System) better, I stumbled upon this little bit of history in [RFC 1034](http://www.ietf.org/rfc/rfc1034.txt):


> RFC 1034             Domain Concepts and Facilities        November 1987
> 
> 2.1. The history of domain names
>
> The impetus for the development of the domain system was growth in the
> Internet:
>
>    - Host name to address mappings were maintained by the Network
>      Information Center (NIC) in a single file (HOSTS.TXT) which
>      was FTPed by all hosts [RFC-952, RFC-953].  The total network
>      bandwidth consumed in distributing a new version by this
>      scheme is proportional to the square of the number of hosts in
>      the network, and even when multiple levels of FTP are used,
>      the outgoing FTP load on the NIC host is considerable.
>      Explosive growth in the number of hosts didn't bode well for
>      the future.

That is, there used to be a single file that mapped hostnames to IP addresses, and everyone on the network would fetch that file over ftp to stay up to date with the network.

To explain the quadratic growth (proportional to the square of the number of hosts), [Nemo](https://self-evident.org/) corrected my explanation with:

> the size of the HOSTS.TXT file is linear in the number of hosts, and the number of hosts that need to download the file is also linear in the number of hosts, therefore the total bandwidth required to distribute the file to all hosts is quadratic in the number of hosts


