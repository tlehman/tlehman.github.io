// Dark mode toggle for the math pages. Shares the 'darkmode' localStorage
// key with the writing pages so the preference follows you around the site.
// The button is created here so pages only need to include this script.
(function () {
    var STORAGE_KEY = 'darkmode';

    function isDark() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) return stored === '1';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply immediately to prevent flash
    if (isDark()) document.documentElement.classList.add('dark');

    document.addEventListener('DOMContentLoaded', function () {
        var dark = isDark();
        var btn = document.createElement('button');
        btn.className = 'darkmode-toggle';
        document.body.appendChild(btn);

        function apply(d) {
            document.documentElement.classList.toggle('dark', d);
            btn.textContent = d ? 'Light' : 'Dark';
        }

        apply(dark);
        btn.addEventListener('click', function () {
            dark = !dark;
            localStorage.setItem(STORAGE_KEY, dark ? '1' : '0');
            apply(dark);
        });
    });
})();
