---
title: "Knuth's web is rewoven"
date: 2026-03-10
---

Two webs were invented in the early '90s. The famous one from Sir Tim Berners Lee, the world-wide-web. Then there's the `CWEB` package from Donald E. Knuth. That was a tool to implement a new style of programming that he called [literate programming][1].

> The main idea is to **treat a program as a piece of literature**, addressed to human beings rather than to a computer. The program is also viewed as a hypertext document, rather like the World Wide Web. (Indeed, I used the word WEB for this purpose long before CERN grabbed it!)

The idea of literate programming is like a level above high-level languages. In the beginning, programmers just worked in [assembly][2] directly. Then came high level languages like C. Literate programming was meant to be an even higher level still.

The flow of a compiler is C → assembly, a literate program would look like CWEB → C → assembly, but also, CWEB → TeX → PDF. The CWEB tool takes a .w file and then outputs .c for the compiler, he calls this *tangling* the source code. Then the CWEB tool also outputs a .tex file that produces a nice PDF that you can print out. The PDF is for humans to read, and it's nice documentation that explains the program in a way that is optimized for _human understanding_, whereas the compiled C code is optimized for _fast execution_.

The reason literate programming never took off is that it was cumbersome. Most programmers just read the code and run it, or run tests, or run static analysis. We don't want to edit docs. Knuth is an academic, so he's into writing pieces of code literature and isn't under pressure to ship running code.

I wrote [LCP](https://github.com/tlehman/literate-classical-physics) which is a literate program in CWEB that simulates Newtonian physics, but I stopped because it was cumbersome to work with CWEB.

Just today, I built a [Claude Code skill](https://code.claude.com/docs/en/skills) that you can run with the command `/literate-programming` and it generates a `$project.lit.md` file that is the new source of truth. The skill looks around for all the entry points and then traces the flow of data through the program, explaining it in a way that is easy for a human to understand, compared with just opening up the files in an editor. This is one linear file, which presents nicely when printed out and read away from the computer.

**Here is the skill to install**: [litprog-skill](https://github.com/tlehman/litprog-skill)

Why did I build this? Because [Amazon is doing mandatory meetings][3] on incidents caused by shipping vibe-coded slop to production. Because despite using OpenCode and Claude Code and all the newest models to be more productive, I can feel my code understanding slipping. Because tweets like this are going viral:

> there is still no substitute for perfectly understanding every single line of code in your codebase
([@gabriel1](https://x.com/gabriel1/status/2029805730048659762))

Every single line. The best way to do that is literally just read it all, but it's best to have it presented in a way that reflects the flow of data through the program. That's what the `/literate-programming` skill does.

Once you run the skill, you can check in the `$project.lit.md` file and then edit _it_, and then running `/literate-programming` again will check the .lit.md file and re-tangle the source code so it can be compiled. It will also regenerate the PDF so the documentation remains up date.

I even made the skill look for changes in the regular source code and then port that back to the .lit.md file. The .lit.md file is the new source of truth.

As an example, I ran this one [Andrej Karpathy][4]'s LLM.c program, and the results are pretty nice: [llm_c.pdf](https://github.com/tlehman/llm.c/blob/litprog/llm_c.pdf).

The purpose of this skill is to bootstrap a document that can help you understand every single line of code, then to have a document you could edit yourself, and those changes would propagate down into the code and documentation. You can still vibe code, but you must never let your understanding of your codebase slip. Stay sharp.

The natural tendency of most dev teams is to prioritize shipping, at the expense of documentation. Now with dev teams twiddling their thumbs while AI agents cook, there's no excuse not to keep the documentation up to date. Using this skill will also prevent the natural drift that happens because LLMs are nondeterministic. This skill uses deterministic tangle and weave commands. The web that Knuth wove is being rewoven.

---

[1]: https://cs.stanford.edu/~knuth/lp.html
[2]: https://en.wikipedia.org/wiki/Assembly_language
[3]: https://x.com/lukolejnik/status/2031257644724342957
[4]: https://karpathy.ai
