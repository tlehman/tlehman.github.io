index.html: index.html.tmpl chiasms.html
	@sed -e '/{{chiasms}}/ {' -e 'r chiasms.html' -e 'd' -e '}' index.html.tmpl > index.html

chiasms.html: chiasms.md
	pandoc -c ../blog-style-2d477e19bcef198aecf876e3c8f68c12.css chiasms.md -o chiasms.html

all: index.html

