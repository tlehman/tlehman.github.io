document.querySelectorAll('a').forEach(link => {
    let localLink = !!link.href.match(/https?:..localhost/) ||
        !!link.href.match(/https?:..tlehman.blog/);

    if(localLink) {
        return;
    }
    // Assuming you are using Google's Favicon Service
    let faviconUrl = `https://www.google.com/s2/favicons?domain=${link.href}`;

    // Create a unique class for each link
    let className = 'favicon-' + link.href.replace(/[^a-zA-Z]/g, '');

    // Add the class to the link
    link.classList.add('link-with-icon', className);

    // Create a CSS rule for the ::after element
    let style = document.createElement('style');
    document.head.appendChild(style);
    style.sheet.insertRule(`
        .${className}::after {
            margin-left: 4px;
            opacity: 0.5;
            background-image: url('${faviconUrl}');
        }
    `);
});
