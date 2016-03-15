const _ = require('underscore');
const zepto = require('zepto-node');
const Base64 = require('crypto-js/enc-base64');
const algorithms = {
  sha1:   require('crypto-js/sha1'),
  sha256: require('crypto-js/sha256'),
  sha384: require('crypto-js/sha384'),
  sha512: require('crypto-js/sha512')
}

const url_regexp = /(https?:)?\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
const domain_regexp = /(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?/i;

const AutoCSP = {
  algorithm: 'sha256',

  setup(algorithm) {
    if (!algorithms[algorithm]) {
      throw new Error('Not supported algorithm')
    }

    this.algorithm = algorithm;
  },

  hash(data) {
    const algorithm = algorithms[this.algorithm];
    const hash = Base64.stringify(algorithm(data));
    return `${this.algorithm}-${hash}`;
  },

  integrities() {
    const corsme  = 'https://crossorigin.me/'; // Thank you for your cors :*
    const defaults  = {mode: 'cors', cache: 'default'};
    const $ = zepto(window);
    const scripts = $('script[src]').map((i, node) => $(node).attr('src'));

    const integrities = _.reject(scripts, this.isLocal).map((url) => {
      if (/^\/\//.test(url)) {
        url = `https:${url}`;
      }

      const promise = fetch(`${corsme}${url}`, defaults)
        .then((response) => {
          return response.text();
        }).then((content) => {
          return { url: url, content: content };
        });

      return Promise.resolve(promise);
    });

    Promise
      .all(integrities)
      .then((resources) => {
        return _.map(resources, (resource) => {
          return {url: resource.url, hash: this.hash(resource.content)};
        });
      })
      .then((integrities) => {
        console.log('Integrity hashes from remote origin scripts:');
        console.table(integrities);
      });
  },

  hashes() {
    const $ = zepto(window);
    const inlines = $('script').filter(':not([src])').filter(':not([nonce])').map((i, node) => node.text);

    const hashes = _.map(inlines, (content) => {
      return {data: content, hash: this.hash(content)};
    });

    console.log('Nonce hashes for inline scripts:');
    console.table(hashes);
  },

  rule() {
    const $ = zepto(window);
    const scripts = $('script[src]').map((i, node) => $(node).attr('src'));
    const inlines = $('script').filter(':not([src])').filter(':not([nonce])').map((node) => node.text);
    const nonces = $('script').filter(':not([src])').filter('[nonce]').map((i, node) => $(node).attr('nonce'));
    const styles = $('link[rel="stylesheet"]').map((i, node) => $(node).attr('href'));
    const images = $('img[src]').map((i, node) => $(node).attr('src'));
    const frames = $('frame[src],iframe[src]').map((i, node) => $(node).attr('src'));
    const media = $('audio source,video source').map((i, node) => $(node).attr('src'));
    const objects = $('object,embed').map((i, node) => $(node).attr('data') || $(node).attr('src'));

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

  isLocal(url) {
    return /^\/[^\/]/.test(url) || /^\./.test(url);
  },

  getRemotes(urls) {
    const self = _.some(urls, this.isLocal);

    const remotes = _.uniq(_.compact(_.map(urls, (url) => {
      const match = url.match(url_regexp);
      const dmatch = match && match[0] && url.match(domain_regexp);

      return dmatch && dmatch[0];
    })));

    const rule = (self ? " 'self'" : '') + ['', ...remotes].join(' ');
    return (rule ? rule : " 'none'");
  },

  getNonces(values) {
    const nonces = _.map(values, (nonce) => {
      return `'nonce-${nonce}'`;
    });

    return ['', ...nonces].join(' ');
  },

  getHashes(contents) {
    const hashes = _.map(contents, (content) => {
      return `'${this.hash(content)}'`;
    });

    return ['', ...hashes].join(' ');
  }
}

module.exports = AutoCSP;
