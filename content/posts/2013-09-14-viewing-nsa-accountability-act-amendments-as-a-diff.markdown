---
categories:
- law
- git
- techno-utopian-psychobabble
comments: true
date: 2013-09-14T00:00:00Z
title: Viewing NSA Accountability Act amendments as a diff
url: /blog/2013/09/14/viewing-nsa-accountability-act-amendments-as-a-diff/
---

A new bill (HR3070) was just introduced a few days ago by Rep. Michael Fitzpatrick [R-PA8]. The bill is:

> To amend section 501 of the Foreign Intelligence Surveillance Act of 1978 to reform access to certain business records for foreign intelligence and international terrorism investigations, and for other purposes. 

The bill is unusually small, but notice section 2, subsection a:

```
  SECTION 1. SHORT TITLE.
  This Act may be cited as the ‘NSA Accountability Act’.

  SECTION 2. REFORMS TO ACCESS TO CERTAIN BUSINESS RECORDS FOR FOREIGN INTELLIGENCE AND INTERNATIONAL TERRORISM INVESTIGATIONS.
  (a) In General- Subsection (b)(2)(A) of section 501 of the Foreign Intelligence Surveillance Act of 1978 (50 U.S.C. 1861) is amended--

    (1) in the matter preceding clause (i)--
      (A) by inserting ‘specific and articulable’ before ‘facts showing’;
      (B) by inserting ‘and material’ after ‘are relevant’; and
      (C) by striking ‘clandestine intelligence activities’ and all that follows and inserting ‘clandestine intelligence activities and pertain only to an individual that is the subject of such investigation; and’; and

  (2) by striking clauses (i) through (iii).

  (b) Withholding of Funds- Notwithstanding any other provision of law, in the case of a violation of section 501 of the Foreign Intelligence Surveillance Act of 1978 (50 U.S.C. 1861) in a fiscal year, all unobligated funds made available for such fiscal year to carry out such section shall be withheld for the period beginning on the date of such violation and ending on September 30 of such fiscal year.

```

It's describing low level text editing operations, here's how it would look as a colored git-style diff:

``` diff
diff --git "a/50_USC_\302\2471861.txt" "b/50_USC_\302\2471861.txt"
index 59e32ec..4bc562a 100644
--- "a/50_USC_\302\2471861.txt"
+++ "b/50_USC_\302\2471861.txt"
@@ -12,10 +12,7 @@ Each application under this section—
         (A) a judge of the court established by section 1803 (a) of this title; or
         (B) a United States Magistrate Judge under chapter 43 of title 28, who is publicly designated by the Chief Justice of the United States to have the power to hear applications and grant orders for the production of tangible things under this section on behalf of a judge of that court; and
     (2) shall include—
-        (A) a statement of facts showing that there are reasonable grounds to believe that the tangible things sought are relevant to an authorized investigation (other than a threat assessment) conducted in accordance with subsection (a)(2) to obtain foreign intelligence information not concerning a United States person or to protect against international terrorism or clandestine intelligence activities, such things being presumptively relevant to an authorized investigation if the applicant shows in the statement of the facts that they pertain to—
-            (i) a foreign power or an agent of a foreign power;
-            (ii) the activities of a suspected agent of a foreign power who is the subject of such authorized investigation; or
-            (iii) an individual in contact with, or known to, a suspected agent of a foreign power who is the subject of such authorized investigation; and
+        (A) a statement of specific and articulable facts showing that there are reasonable grounds to believe that the tangible things sought are relevant and material to an authorized investigation (other than a threat assessment) conducted in accordance with subsection (a)(2) to obtain foreign intelligence information not concerning a United States person or to protect against international terrorism or clandestine intelligence activities and pertain only to an individual that is the subject of such investigation; and
         (B) an enumeration of the minimization procedures adopted by the Attorney General under subsection (g) that are applicable to the retention and dissemination by the Federal Bureau of Investigation of any tangible things to be made available to the Federal Bureau of Investigation based on the order requested in such application.
 (c) Ex parte judicial order of approval
     (1) Upon an application made pursuant to this section, if the judge finds that the application meets the requirements of subsections (a) and (b), the judge shall enter an ex parte order as requested, or as modified, approving the release of tangible things. Such order shall direct that minimization procedures adopted pursuant to subsection (g) be followed.
```

The next logical step would be to put these documents (the whole United States Code and all other established law) into a git repository, then Congress could use [branches](http://git-scm.com/book/en/Git-Branching-Basic-Branching-and-Merging) to work on their drafts, and [pull requests](https://help.github.com/articles/using-pull-requests) for the various votes, merging or closing depending on the vote count.

I am not even close to the first person to think of this, here are a few that had a similar idea first:

 - [Abe Voelker](https://blog.abevoelker.com/gitlaw-github-for-laws-and-legal-documents-a-tourniquet-for-american-liberty/) on GitLaw
 - [John Watkinson, Matt Hall, Veronica Picciafuocco, John Watkinson, Alvaro Casanova](https://www.docracy.com/application/about) from Docracy
 - [Stefan Wehrmeyer](http://www.wired.com/wiredenterprise/2012/08/bundestag/) with all of German Federal Law

Requiring all law to be in this form is a good first step toward my ideal of Computable Law. The idea is basically that all laws have to be:

 1. accessible by a computer
 2. unambiguous enough to be interpreted by a computer, such that:

     - any relation to existing law can be discovered
     - consistency with existing law can be checked
     - hypothetical situations could be tested for legality

Using git and diff to view amendments would only work towards (1), the next step would require that all existing law is first accessible by computer. Then, it would have to be converted into a computer language such as [Prolog](https://en.wikipedia.org/wiki/Prolog) that alone would lead to much debate, particularly when ambiguities are encountered. Then, programs could be written to interpret it and compute verdicts to cases. Another benefit would be the ability to identify all contradictions, and then remove them.

The next step would be to have a robotic authority above all three [(or four)](/blog/2013/08/13/an-unbalance-of-powers/) branches of Government, that ensures our elected officials are behaving according to those rules. Law is ineffectual unless it is enforced, and law cannot be enforced by a robot that doesn't understand the rules it is supposed to be enforcing.

If I had any intial point at all, it would be: _Legislators should use modern tools for recording changes to laws_.

Then we can get on to replacing them with machines.

