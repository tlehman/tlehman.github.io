---
categories:
- law
- legal
- open-source
comments: true
date: 2012-09-18T00:00:00Z
title: 'Terms of Service; Didn''t Read: Making terms and conditions digestible'
url: /blog/2012/09/18/terms-of-service-didnt-read-making-terms-and-conditions-digestible/
---

Suppose you are signing up for some web service, and you are getting close to the end of the process. Inevitably, you are presented with the Terms, Conditions and Privacy Policy for the service. 

If you are like me (and all people who don't have a Law degree and several days to analyze all the details in the policy), you scroll to the bottom and accept. Maybe, if you are feeling extra clever, you search the page for dollar signs and keywords that might be relevant. You think to yourself, *it's mostly just stuff that the company has there so it doesn't get sued by foolish users, it can't be that bad*. This is probably true, but regardless, by clicking accept, you are agreeing to be *bound by law* by those terms. That means that the cost of being wrong is very high.

This is the motivation for a project called [Terms of Service; Didn't Read](http://tos-dr.info), or ToS;DR for short. ToS;DR is a project that aims to summarize the terms, conditions and privacy policies of applications and services on the web. The process is simple, peple pick services they are interested in, Google for example, and then read some of the terms, and extract "points" that then get discussed, analyzed and rated. The result is then made available via an open API, and this can be incorporated into apps that make it easy to realize what you are about to (or already have) agreed to.

All of the data is published under the AGPL, a license that protects the data from being locked into a walled garden that is controlled by some small group. The data is, and always will be, free. In both senses of the word. The purpose of the data is to help us all be better informed without having to spend all of our time reading legal documents.

Here is what the summarized results look like:
{% img /images/blogimg/tosdr_example.png %}

There is a hierarchy of detail, with the top level being the bare-minimum required to get what the terms say. Then, if you click "Expand", you can see the quote from the original terms, and then if you want more detail, you can read the entire terms by following a link back to the source document. 

ToS;DR also has Chrome and Firefox browser extensions so that you can see these bullet points for the website you are currently on.

Currently, this is all volunteer based, and there are many services that haven't been thoroughly analyzed and rated yet. The project is using a Kickstarter-like service to raise 10,000 Euros so that they can support people working full time on this. There are higher tiers of contribution that give the contributor voting priveledges, so you can vote for a service that you would really like to have their terms exposed.

If you believe in this cause, you can contribute on the [Google Group](https://groups.google.com/forum/?fromgroups#!forum/tosdr) or [Donate](http://www.indiegogo.com/terms-of-service-didnt-read?a=1338010) to their fundraising campaign.