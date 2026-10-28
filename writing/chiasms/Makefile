index.html: index.html.tmpl chiasms.html
	@sed -e '/{{chiasms}}/ {' -e 'r chiasms.html' -e 'd' -e '}' index.html.tmpl > index.html

chiasms.html: chiasms.md
	pandoc -c ../blog-style-c95649ab0394022103d59996f0d4a44c.css chiasms.md -o chiasms.html

all: index.html

