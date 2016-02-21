# autocsp
========================================

Autocsp is just another tool to generate a valid Content Security Policy header
for your current webpage.

Basically, it analizes your DOM tags looking for sources for all the rules:

- **default-src:**
- **script-src:**
- **style-src:**
- **img-src:**
- **child-src:**
- **media-src:**
- **object-src:**

Not supported yet:

- **font-src:**
- **connect-src:**

So something like this:

```html
<script src="http://cdn..../autocsp.min.js"></script>
```

and you will get a console output like this:

```
Content-Security-Policy: default-src 'none'; script-src 'self' www.google-analytics.co www.googletagmanager.co i.kissmetrics.co cdn.ravenjs.co 'sha256-faDewrRjLN6HVr4qFb34mLsJTMWzibMGtolRQsuqEB0=' 'sha256-Dvu64ENYzDEkDpriV+KtNqfahz95IoNI4db+QIp9F+g='; style-src 'self' fonts.googleapis.co; img-src 'self' secure.gravatar.co; child-src 'none'; font-src 'self'; connect-src 'self'; media-src 'none'; object-src 'none';
```

It's important to understand that this should not be the common flow to create
this header for your web page. When you start creating a webpage, you need to
control all the orgins where you resquest from, instead of generate them
afterwards. However, for projects that have not controlled their source origins
in the past, this tool could be useful to spot them.

```javascript
AutoCSP.generateCurrentRule();
```

# TODO

- Generate integrity tags fo remote scripts
- Detect font-src urls: we need to parse css to retreive them
- Detect connect urls: we need to analyze XHR traffic
