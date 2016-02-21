const cheerio = require('cheerio');
const _ = require('underscore');
const CryptoJS = require('crypto-js');
const SHA256 = require('crypto-js/sha256');

const url_regexp = /(https?:)?\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
const domain_regexp = /(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?/i;

let $;

window.onload = () => {
  $ = cheerio.load(document.documentElement.innerHTML);
};

const AutoCSP = {
  generateCurrentRule() {
    const scripts = $('script[src]').map(function(){return this.attribs.src;}).get();
    const inlines = $('script').filter(':not([src])').filter(':not([nonce])').map(function(){return this.firstChild.data});
    const nonces = $('script').filter(':not([src])').filter('[nonce]').map(function(){return this.attribs.nonce});
    const styles = $('link[rel="stylesheet"]').map(function(){return this.attribs.href;}).get();
    const images = $('img[src]').map(function(){return this.attribs.src;}).get();
    const frames = $('frame[src],iframe[src]').map(function(){return this.attribs.src;}).get();
    const media = $('audio source,video source').map(function(){return this.attribs.src}).get();
    const objects = $('object,embed').map(function(){return this.attribs.data || this.attribs.src}).get();

    const fonts = ['/foo']; // FIXME
    const connects = ['/foo']; // FIXME

    const default_src = " 'none'";
    const script_src  = this.getRemotes(scripts);
    const digest_src  = this.getHashes(inlines);
    const nonce_src  = this.getNonces(nonces);
    const style_src   = this.getRemotes(styles);
    const img_src     = this.getRemotes(images);
    const child_src   = this.getRemotes(frames);
    const media_src   = this.getRemotes(media);
    const object_src  = this.getRemotes(objects);

    const font_src    = this.getRemotes(fonts);
    const connect_src = this.getRemotes(connects);

    return `Content-Security-Policy: default-src${default_src}; script-src${script_src}${digest_src}${nonce_src}; style-src${style_src}; img-src${img_src}; child-src${child_src}; font-src${font_src}; connect-src${connect_src}; media-src${media_src}; object-src${object_src};`;
  },

  getRemotes(urls) {
    const self = _.some(urls, function (url) {
      return /^\/[^\/]/.test(url) || /^\./.test(url);
    });

    const remotes = _.uniq(_.compact(_.map(urls, function (url) {
      const match = url.match(url_regexp);
      const dmatch = match && match[0] && url.match(domain_regexp);

      return dmatch && dmatch[0];
    })));

    const rule = (self ? " 'self'" : '') + ['', ...remotes].join(' ');
    return (rule ? rule : " 'none'");
  },

  getNonces(values) {
    const nonces = _.map(values, function (nonce) {
      return `'nonce-${nonce}'`;
    });

    return ['', ...nonces].join(' ');
  },

  getHashes(contents) {
    const hashes = _.map(contents, function (content) {
      const hash = CryptoJS.enc.Base64.stringify(SHA256(content));
      return `'sha256-${hash}'`;
    });

    return ['', ...hashes].join(' ');
  }
}

export default AutoCSP;
