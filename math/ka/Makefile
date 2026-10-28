tex:
	pandoc kolmogorov-arnold.lhs -o kolmogorov-arnold.tex

pdf: tex
	pdflatex kolmogorov-arnold.tex

hs:
	ghci kolmogorov-arnold.lhs


clean:
	rm *.tex *.log *.pdf *.aux
