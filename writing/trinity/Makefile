# Makefile for trinity document
# Builds both PDF and HTML versions with proper tikz-cd diagram backgrounds

TEXFILE = trinity-new.tex
BASENAME = trinity-new
PDF_OUTPUT = $(BASENAME).pdf
HTML_OUTPUT = $(BASENAME).html

# LaTeX compiler
LATEX = pdflatex
LATEX_FLAGS = -interaction=nonstopmode -halt-on-error

# Pandoc settings
PANDOC = pandoc
PANDOC_FLAGS = --from latex --to html5 --standalone --mathjax
PANDOC_CSS = --css style.css

.PHONY: all pdf html clean

all: pdf html

pdf: $(PDF_OUTPUT)

html: $(HTML_OUTPUT)

$(PDF_OUTPUT): $(TEXFILE)
	@echo "Building PDF version..."
	$(LATEX) $(LATEX_FLAGS) $(TEXFILE)
	$(LATEX) $(LATEX_FLAGS) $(TEXFILE)  # Run twice for cross-references
	@echo "PDF built successfully: $(PDF_OUTPUT)"

$(HTML_OUTPUT): $(TEXFILE)
	@echo "Building HTML version..."
	# Create a temporary version with web background colors
	sed 's/\\printtrue/\\webtrue\\def\\webversion{}/g' $(TEXFILE) > $(BASENAME)-web.tex
	$(LATEX) $(LATEX_FLAGS) $(BASENAME)-web.tex
	$(LATEX) $(LATEX_FLAGS) $(BASENAME)-web.tex  # Run twice for cross-references
	$(PANDOC) $(PANDOC_FLAGS) $(PANDOC_CSS) $(BASENAME)-web.tex -o $(HTML_OUTPUT)
	@echo "HTML built successfully: $(HTML_OUTPUT)"
	# Clean up temporary files
	rm -f $(BASENAME)-web.*

clean:
	rm -f *.aux *.log *.out *.toc *.nav *.snm *.vrb *.fls *.fdb_latexmk *.synctex.gz
	rm -f $(BASENAME)-web.*
	rm -f $(PDF_OUTPUT) $(HTML_OUTPUT)

# Individual clean targets
clean-pdf:
	rm -f $(PDF_OUTPUT)

clean-html:
	rm -f $(HTML_OUTPUT)

# Help target
help:
	@echo "Available targets:"
	@echo "  all      - Build both PDF and HTML versions"
	@echo "  pdf      - Build PDF version only"
	@echo "  html     - Build HTML version only"
	@echo "  clean    - Remove all generated files"
	@echo "  clean-pdf - Remove PDF output only"
	@echo "  clean-html - Remove HTML output only"
	@echo "  help     - Show this help message"