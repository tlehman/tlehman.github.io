(function () {
    var toolbar = null;
    var modalOverlay = null;

    function getArticleTitle() {
        var h1 = document.querySelector("h1");
        return h1 ? h1.textContent.trim() : document.title;
    }

    function getArticleUrl() {
        return window.location.href;
    }

    function removeToolbar() {
        if (toolbar) {
            toolbar.remove();
            toolbar = null;
        }
    }

    function removeModal() {
        if (modalOverlay) {
            modalOverlay.remove();
            modalOverlay = null;
        }
    }

    function truncate(str, max) {
        return str.length > max ? str.slice(0, max) + "..." : str;
    }

    function showShareModal(quote) {
        removeModal();
        var title = getArticleTitle();
        var url = getArticleUrl();
        var shareText = '"' + truncate(quote, 200) + '" - ' + title + " " + url;

        var twitterUrl = "https://x.com/intent/tweet?text=" + encodeURIComponent(shareText);
        var bskyUrl = "https://bsky.app/intent/compose?text=" + encodeURIComponent(shareText);
        var hnUrl = "https://news.ycombinator.com/submitlink?u=" + encodeURIComponent(url) + "&t=" + encodeURIComponent(title);
        var linkedinUrl = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
        var facebookUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&quote=" + encodeURIComponent(quote);

        modalOverlay = document.createElement("div");
        modalOverlay.className = "annotation-modal-overlay";
        modalOverlay.innerHTML =
            '<div class="annotation-modal">' +
                "<h3>Share this quote</h3>" +
                "<blockquote>" + escapeHtml(quote) + "</blockquote>" +
                '<div class="annotation-copy-row">' +
                    '<textarea class="annotation-copy-text" readonly>' + escapeHtml(shareText) + "</textarea>" +
                    '<button class="annotation-copy-btn">Copy</button>' +
                "</div>" +
                '<div class="annotation-share-links">' +
                    '<a class="share-twitter" href="' + twitterUrl + '" target="_blank" rel="noopener">X / Twitter</a>' +
                    '<a class="share-bluesky" href="' + bskyUrl + '" target="_blank" rel="noopener">Bluesky</a>' +
                    '<a class="share-hn" href="' + hnUrl + '" target="_blank" rel="noopener">Hacker News</a>' +
                    '<a class="share-linkedin" href="' + linkedinUrl + '" target="_blank" rel="noopener">LinkedIn</a>' +
                    '<a class="share-facebook" href="' + facebookUrl + '" target="_blank" rel="noopener">Facebook</a>' +
                "</div>" +
                '<button class="annotation-close-btn">Close</button>' +
            "</div>";

        document.body.appendChild(modalOverlay);

        modalOverlay.querySelector(".annotation-copy-btn").addEventListener("click", function () {
            var textarea = modalOverlay.querySelector(".annotation-copy-text");
            navigator.clipboard.writeText(textarea.value).then(function () {
                var btn = modalOverlay.querySelector(".annotation-copy-btn");
                btn.textContent = "Copied!";
                setTimeout(function () { btn.textContent = "Copy"; }, 1500);
            });
        });

        modalOverlay.querySelector(".annotation-close-btn").addEventListener("click", function () {
            removeModal();
        });

        modalOverlay.addEventListener("click", function (e) {
            if (e.target === modalOverlay) removeModal();
        });
    }

    function escapeHtml(str) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function showToolbar(x, y, selectedText) {
        removeToolbar();

        toolbar = document.createElement("div");
        toolbar.className = "annotation-toolbar";
        toolbar.innerHTML =
            '<button class="annotation-share-btn">Share</button>' +
            '<button class="annotation-challenge-btn">Challenge this</button>';

        document.body.appendChild(toolbar);

        // Position toolbar above the selection
        var rect = toolbar.getBoundingClientRect();
        var left = x - rect.width / 2;
        var top = y - rect.height - 8;

        // Keep within viewport
        left = Math.max(4, Math.min(left, window.innerWidth - rect.width - 4));
        if (top < 4) top = y + 8;

        toolbar.style.left = (left + window.scrollX) + "px";
        toolbar.style.top = (top + window.scrollY) + "px";

        toolbar.querySelector(".annotation-share-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            removeToolbar();
            showShareModal(selectedText);
        });

        toolbar.querySelector(".annotation-challenge-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            removeToolbar();
            var title = getArticleTitle();
            var subject = "Challenging quote in " + title;
            var body = '"' + selectedText + '"';
            window.location.href = "mailto:mail@tobilehman.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        });
    }

    function handleSelectionChange(e) {
        // Small delay to let selection finalize
        setTimeout(function () {
            var sel = window.getSelection();
            var text = sel ? sel.toString().trim() : "";

            if (!text) {
                removeToolbar();
                return;
            }

            var range = sel.getRangeAt(0);
            var rect = range.getBoundingClientRect();
            var x = rect.left + rect.width / 2;
            var y = rect.top;

            showToolbar(x, y, text);
        }, 10);
    }

    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);

    // Dismiss toolbar when clicking outside
    document.addEventListener("mousedown", function (e) {
        if (toolbar && !toolbar.contains(e.target)) {
            removeToolbar();
        }
    });
})();
