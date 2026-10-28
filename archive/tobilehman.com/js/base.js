
/* Begin Dark Mode */
function activateDarkMode() {
    document.getElementsByTagName("html")[0].dataset.theme = "dark";
    var toggle = document.getElementById("dark-mode-toggle");
    toggle.innerHTML = "Light Mode";
    toggle.onclick = activateLightMode;
    localStorage.setItem("color-scheme", "dark");
}
function activateLightMode() {
    document.getElementsByTagName("html")[0].dataset.theme = "light";
    var toggle = document.getElementById("dark-mode-toggle");
    toggle.onclick = activateDarkMode;
    toggle.innerHTML = "Dark Mode";
    localStorage.setItem("color-scheme", "light");
}

window.onload = function() {
    if (localStorage.getItem("color-scheme") == "dark") {
        activateDarkMode();
    } else {
        activateLightMode();
    }
}
