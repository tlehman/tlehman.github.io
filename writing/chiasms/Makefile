index.html: index.html.tmpl chiasms.html
	@sed -e '/{{chiasms}}/ {' -e 'r chiasms.html' -e 'd' -e '}' index.html.tmpl > index.html

chiasms.html: chiasms.md
	pandoc -c ../blog-style-6d76934a57c444aa502311f9bcf68c8a.css chiasms.md -o chiasms.html

all: index.html

