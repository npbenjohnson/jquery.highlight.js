/// jQuery highlight usage example found at https://github.com/npbenjohnson/jquery.highlight.js/

jQuery.fn.highlight = function (pattern, options) {

    var settings = $.extend({
        // Highlight highlights children, anything else removes highlights
        action: 'highlight',
        // CSS class added with highlight spans
        highlightClass: 'highlighted',
        // determines if indexof search skips by 1 (greedy) or word length (lazy)
        greedy: true,
        // automatically calls unhighlight on elements before performing a highlight
        autoClear: true
    }, options);

    function hasClass(node, cls) {
        return node && node.className && (' ' + node.className + ' ').indexOf(' ' + cls + ' ') > -1;
    }

    function isTextNode(node) {
        return node && node.nodeType === 3;
    }

    function isSpan(node) {
        return node && node.nodeName === 'SPAN';
    }

    function isWhitespace(node) {
        if (!isTextNode(node))
            return false;
        if (node.data.replace(/[\t\n\r ]+/, '').length === 0)
            return true;
    }

    function cleanWhitespace(node) {
        if (node.data)
            if (isWhitespace(node))
                return '';
            else
                node.data = node.data.replace(/[\t\n\r ]+/g, ' ');
        return node;
    }

    function isHighlighted(node) {
        while (node !== null) {
            node = node.parentNode;
            if (hasClass(node, settings.highlightClass))
                return true;
        }
        return false;
    }

    /// Traverses nodes until it finds a non-span non-text node,
    // or a non-whitespace text node
    function nextNodeIsText(node, lastNode) {
        if (node === null)
            return { result: false, node: null };

        var next = nextChildOrSiblingOrParent(node, lastNode);
        while (isSpan(next))
            next = nextChildOrSiblingOrParent(next, lastNode);

        if (isTextNode(next))
            return isWhitespace(next) ? nextNodeIsText(next, lastNode) : { result: true, node: next };

        return { result: false, node: next }; // next node is not text
    }

    /// Get whole text from joining adjacent text elements
    function wholeTextWithSpans(node, lastNode) {
        var wholeText = cleanWhitespace(node).data;

        do {
            result = nextNodeIsText(node, lastNode);
        } while (result
            && result.result
            && (node = result.node)
            && (wholeText += cleanWhitespace(node).data))

        return wholeText;
    }

    /// Get all occurences of patterns within string, return 
    // as ranges of [minindex, maxindex]
    function indexOfAll(string, patterns) {
        var matchList = [];
        for (var i = 0; i < patterns.length; i++) {
            var pat = patterns[i];
            var len = pat.length;
            var match = 0;
            do {
                match = string.indexOf(pat, match);
                if (match !== -1) {
                    matchList.push([match, match + len]);
                    match += settings.greedy ? 1 : len;
                }
            } while (match !== -1)
        }
        // Array will only be sorted if 1 search term was used
        // otherwise sort by minIndex
        if (patterns.length > 1)
            matchList = matchList.sort(function (a, b) {
                if (a[0] > b[0])
                    return 1;
                if (a[0] < b[0])
                    return -1;
                return 0;
            });
        return matchList;
    };

    /// Wraps a section of a specified node in a highlight span
    function wrapWithSpan(node, index, length) {
        var newNode = document.createElement('span');
        newNode.className = settings.highlightClass;
        var highlightNode = node.splitText(index);
        var nextNode = highlightNode.splitText(length);
        var old = highlightNode.parentNode.replaceChild(newNode, highlightNode);
        newNode.insertBefore(old);
        return nextNode;;
    }

    /// Merges ranges from IndexOfAll which intersect
    function mergeRanges(ranges) {
        var merges = [];
        // Combine intersecting pre-ordered ranges
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            while (i < ranges.length - 1 && range[0] <= ranges[i + 1][1] && ranges[i + 1][0] <= range[1]) {
                range[1] = Math.max(range[1], ranges[i + 1][1]);
                i++;
            }
            merges.push(range);
        }
        return merges;
    }

    /// Performs highlighting on node until lastNode is hit
    function highlight(node, pat, lastNode) {
        // highlighting finished, return
        if (node === null)
            return null;

        // don't process script and style tags, skip to sibling or parent
        if (/(script|style)/i.test(node.tagName))
            return nextSiblingOrParent(node);

        if (isTextNode(node)) {
            // Get all text from adjacent nodes
            var str = wholeTextWithSpans(node, lastNode).toUpperCase();
            // process if all nodes aren't whitespace
            if (!isWhitespace(str)) {
                // find all matches
                var matches = mergeRanges(indexOfAll(str, pat));
                // text index
                var ti = 0;
                // match index
                var mi = 0;
                var nodeLength, min, max;
                // loop until all matches highlighted
                while (mi < matches.length) {
                    nodeLength = node.data.length;
                    min = matches[mi][0];
                    max = matches[mi][1];

                    if (nodeLength + ti > min) {
                        // match found in this element
                        if (nodeLength < max - ti) {
                            // match continues into next element
                            if (!isHighlighted(node))
                                node = wrapWithSpan(node, min - ti, nodeLength - (min - ti));
                            ti += nodeLength;
                            matches[mi][0] = ti;
                            node = nextNodeIsText(node, lastNode).node;
                        }
                        else {
                            // match contained in this element
                            if (!isHighlighted(node)) {
                                node = wrapWithSpan(node, min - ti, max - min);
                                ti = max;
                                nodeLength -= max;
                            }
                            mi++;
                        }
                    }
                    else {
                        // move to next text node
                        node = nextNodeIsText(node, lastNode).node;
                        ti += nodeLength;
                    }
                }
            }
        }
        // Move up to the text node that starts a section
        var result = { node: node };
        do {
            node = result.node;
            result = nextNodeIsText(node, lastNode);
        } while (result.node && (isTextNode(node) === isTextNode(result.node) || !result.result));
        return result.node;
    }

    function nextChildOrSiblingOrParent(node, lastNode) {
        if (node.firstChild !== null)
            return node.firstChild;
        return nextSiblingOrParent(node, lastNode);
    }

    function nextSiblingOrParent(node, lastNode) {
        if (node.nextSibling)
            return node.nextSibling;
        while (node.parentNode !== lastNode) {
            node = node.parentNode;
            if (node.nextSibling != null)
                return node.nextSibling;
        }
        return null;
    }

    // Removes highlights from a node
    function unhighlight($node) {
        return $node.find('span.' + settings.highlightClass).each(function () {
            var parent = this.parentNode;
            while (this.childNodes.length > 0) {
                parent.insertBefore(this.firstChild, this);
            }
            parent.removeChild(this);
            parent.normalize();
        });
    }

    // if action is not highlight, perform unhighlighting
    if (settings.action !== 'highlight') {
        unhighlight(this);
        return this;
    }

    // unhighlight when autoclear is on
    if (settings.autoClear)
        unhighlight(this);

    // Clean up search terms
    if (!(pattern instanceof Array))
        pattern = [pattern];
    pattern = pattern.filter(
        function (p) { return p !== undefined && p != null && p.trim() !== '' }
        ).map(function (p) { return p.toUpperCase(); });

    // Exit if no valid search terms
    if (!(this.length && pattern && pattern.length))
        return this;

    // Get node to perform highlighting on
    var node = this[0];
    if (node.nodeType === 1)
        if (this.children().length > 0)
            node = this.children()[0];
        else
            return;

    // Loop / recurse through all nodes
    var lastNode = node.parentNode;
    var nextNode = node;
    do {
        nextNode = highlight(nextNode, pattern, lastNode);
    } while (nextNode)

    return this;
};
