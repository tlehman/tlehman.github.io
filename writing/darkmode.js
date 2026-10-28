// Dark mode toggle with localStorage persistence and favicon swapping
(function () {
    var STORAGE_KEY = 'darkmode';

    function isDark() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) return stored === '1';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function setFavicons(dark) {
        var icons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
        icons.forEach(function (link) {
            var href = link.getAttribute('href');
            if (dark) {
                link.setAttribute('href', href.replace(/((?:\.\/|\/)img\/[^/]*)(\.(png|ico))/, '$1-darkmode$2'));
            } else {
                link.setAttribute('href', href.replace(/-darkmode(\.(png|ico))/, '$1'));
            }
        });
    }

    function setImages(dark) {
        var imgs = document.querySelectorAll('nav img[alt="logo"], .container img');
        imgs.forEach(function (img) {
            var src = img.getAttribute('src');
            if (dark) {
                img.setAttribute('src', src.replace(/((?:\.\/|\/)img\/[^/]*)(\.(png|ico))/, '$1-darkmode$2'));
            } else {
                img.setAttribute('src', src.replace(/-darkmode(\.(png|ico))/, '$1'));
            }
        });
    }

    function apply(dark) {
        document.documentElement.classList.toggle('dark', dark);
        setFavicons(dark);
        setImages(dark);
        var btn = document.querySelector('.darkmode-toggle');
        if (btn) btn.textContent = dark ? 'Light' : 'Dark';
    }

    // Apply immediately to prevent flash
    if (isDark()) document.documentElement.classList.add('dark');

    document.addEventListener('DOMContentLoaded', function () {
        var dark = isDark();
        apply(dark);

        var btn = document.querySelector('.darkmode-toggle');
        if (btn) {
            btn.addEventListener('click', function () {
                dark = !dark;
                localStorage.setItem(STORAGE_KEY, dark ? '1' : '0');
                apply(dark);
            });
        }
    });
})();
