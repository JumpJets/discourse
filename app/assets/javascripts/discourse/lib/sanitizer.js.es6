const _validTags = {};
const _validClasses = {};
const _validIframes = [];

function validateAttribute(tagName, attribName, value) {
  var tag = _validTags[tagName];

  // Handle classes
  if (attribName === "class") {
    if (_validClasses[value]) { return value; }
  }

  if (attribName.indexOf('data-') === 0) {
    // data-* catch-all validators
    if (tag && tag['data-*'] && !tag[attribName]) {
      var permitted = tag['data-*'];
      if (permitted && (
            permitted.indexOf(value) !== -1 ||
            permitted.indexOf('*') !== -1 ||
            ((permitted instanceof RegExp) && permitted.test(value)))
         ) { return value; }
    }
  }

  if (tag) {
    var attrs = tag[attribName];
    if (attrs && (attrs.indexOf(value) !== -1 ||
          attrs.indexOf('*') !== -1) ||
        _.any(attrs, function(r) { return (r instanceof RegExp) && r.test(value); })
       ) { return value; }
  }
}

function attr(name, value) {
  return `${name}="${window.filterXSS.escapeAttrValue(value)}"`;
}

export function hrefAllowed(href) {
  // escape single quotes
  href = href.replace(/'/g, "%27");

  // absolute urls
  if (/^(https?:)?\/\/[\w\.\-]+/i.test(href)) { return href; }
  // relative urls
  if (/^\/[\w\.\-]+/i.test(href)) { return href; }
  // anchors
  if (/^#[\w\.\-]+/i.test(href)) { return href; }
  // mailtos
  if (/^mailto:[\w\.\-@]+/i.test(href)) { return href; }
}

export function sanitize(text, whiteLister) {
  if (!window.filterXSS || !text) return "";

  // Allow things like <3 and <_<
  text = text.replace(/<([^A-Za-z\/\!]|$)/g, "&lt;$1");

  const whiteList = whiteLister.getWhiteList();
  const result = window.filterXSS(text, {
    whiteList: whiteList.tagList,
    stripIgnoreTagBody: '*',
    onIgnoreTagAttr(tag, name, value) {
      const forTag = whiteList.attrList[tag];
      if (forTag) {
        const forAttr = forTag[name];
        if ((forAttr && (forAttr.indexOf('*') !== -1 || forAttr.indexOf(value) !== -1)) ||
            (name.indexOf('data-') === 0 && forTag['data-*']) ||
            ((tag === 'a' && name === 'href') && hrefAllowed(value)) ||
            (tag === 'img' && name === 'src' && /^data:image.*$/i.test(value) || hrefAllowed(value)) ||
            (tag === 'iframe' && name === 'src' && _validIframes.some(i => i.test(value)))) {
          return attr(name, value);
        }
      }
    }
  });

  return result.replace(/\[removed\]/g, '').replace(/ \/>/g, '>');
};

export function whiteListTag(tagName, attribName, value) {
  _validTags[tagName] = _validTags[tagName] || {};
  _validTags[tagName][attribName] = _validTags[tagName][attribName] || [];
  _validTags[tagName][attribName].push(value || '*');
}

export function whiteListClass() {
  var args = Array.prototype.slice.call(arguments);
  args.forEach(function (a) { _validClasses[a] = true; });
}

export function whiteListIframe(regexp) {
  _validIframes.push(regexp);
}

// used for pinned topics
whiteListIframe(/^(https?:)?\/\/www\.google\.com\/maps\/embed\?.+/i);
whiteListIframe(/^(https?:)?\/\/www\.openstreetmap\.org\/export\/embed.html\?.+/i);
