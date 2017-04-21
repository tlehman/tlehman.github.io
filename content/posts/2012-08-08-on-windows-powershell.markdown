---
categories:
- windows
- powershell
- command-line
comments: true
date: 2012-08-08T00:00:00Z
title: On Windows PowerShell
url: /2012/08/08/on-windows-powershell/
---

If you use both Unix-like and Windows operating systems, then you have
probably felt the nagging lack of a good command line for windows. The
windows `cmd.exe` is a very lame DOS-like shell.

There are always ports of a Unix-like environment to windows, such as
[Cygwin](http://www.cygwin.com). However, since most of the
configurations on Windows are not text files, this has limited utility.

The best candidate for a native CLI for Windows is
[PowerShell](http://en.wikipedia.org/wiki/Powershell), 
it's only about three years old (since the initial stable release), 
but it works very differently from Bash or Zsh.

Bash and Zsh work primarily with strings, the output of one program can
be piped in as input to another program, and all of the GNU tools we
know and love like `grep` and `awk` are basically string processors.

PowerShell works with native .NET objects, so the input to and output of a cmdlet is an object. This takes some getting used to if you are familiar with bash and working in a Unix environment. As an example, the `Get-Date` cmdlet returns an instance of the `DateTime` class, which has a `Year` method that returns an integer: 

```
> (Get-Date).Year
2012

> (Get-History)[2..4]

 Id CommandLine
 -- -----------
 3  Get-Location
 4  Compare-Object $(Get-Content foo.bat) $(Get-Content bar.bat)
 5  (Get-Date).Year
```

This can enable a much richer command line experience, but as I am a
PowerShell newcomer, I don't have many examples yet. I am not saying that one is better, just that they are tools grown for their own unique environments.

Since Unix has been around longer and I am more familar with
command-line interfaces on Unix, I wanted to make a mapping from common Unix command line tasks 
to PowerShell cmdlets. I know there are already a few [articles](http://windows-powershell-scripts.blogspot.com/2009/06/unix-equivalents-in-powershell.html) about this, but I wanted to make a quick reference table that others could contribute to on GitHub.


I give you: [A Unix to PowerShell Rosetta Stone](http://tobilehman.com/command-line)
