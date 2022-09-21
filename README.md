## Why is this website accessible?

The [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) is a document that contains all the instructions for creating accessible content on the web. This document is maintained by W3C, the organization that regulates web standards worldwide. This portfolio was developed to meet those standards.

Check out the main features that make this an accessible website (or very close to it):

- **HTML semantics** – Correct use of HTML 5 tags that provide meaning for its content.
- **Color contrast** – All color combinations between text and background have a contrast of at least 4.5:1.
- **Keyboard navigation** – All functionalities are available from keyboard and the focus are always visible.
- **Reduce motion** – Identifies user's system preferences to disable or enable animations.
- **Dark and light theme** – Identifies user's system preferences to choose between dark or light themes.
- **Responsive** – The website adjusts for all screen sizes.
- **Zoom** – It supports up to 400% zoom without breaking the page.
- **Right to left** – Both right-to-left and left-to-right versions are supported.
- **Form errors** – Contact form errors are clearly presented and guides the user on how to fix them.
- **Images description** – Non-decorative images have alternative text.
- **User has the control** – Although the site adopts settings based on user's system preferences, an interactive panel is available for the user to manage preferences on their own.

### Development

Run the command `npm run start` to start the server and open `http://localhost:8080` in browser. The site will reload automatically when changes in the source files are saved.

### Production

Run the command `npm run build` to generate production files. The `dist/` folder containing the files will be created.

## Editing

### Changing the color

By default it comes in yellow, but you also have a choice between five others colors available in the project.

To change the color open the file `src/index.js` and find the line that imports the `.scss` color file:

```js
import './scss/yellow.scss';
```

Change `yellow.scss` for one of the options below:

- blue.scss
- orange.scss
- pink.scss
- green.scss
- red.scss
- purple.scss

Finally, save the file.

### Changing the language

By default it uses the English language. To change it you should edit the value of the lang attribute in the opening `<html>` tag of the `index.html` and `404.html` files.

See the example below of how to switch from English to Brazilian Portuguese language

First the English language:

```html
<html lang="en"></html>
```

Now the changing to Portuguese language:

```html
<html lang="pt"></html>
```

### Changing the direction of the content (rtl)

One of the site's goals is to be a portfolio can be used by anyone regardless of their language. Because there are some cultures in the world that have a right-to-left writing order and it was developed to support this as well.

The left-to-right writing order is the default. To change it you should open the `src/index.js` file and go to the line that import the main css file.

```js
import './scss/main.ltr.scss';
```

Change `main.ltr.scss` to `main.rtl.scss`:

```js
import './scss/main.rtl.scss';
```

Save the file.

### Creating your own styles

Nothing prevents you from editing the files anyway you want. However, to avoid conflicts with the styles defined in the existing `.scss` files, utilize the `custom.scss` file to create your own styles. It is located in the `src/scss/` folder.

```html
jpsantos-portfolio/ |-- src/ |---- scss/ |------ custom.scss
```
### Isotope plugin

Isotope is one of the javascript plugins used. Although Isotope has a free license for personal and open source projects, it also has a specific license for commercial projects. Therefore, read carefully about the [license of Isotope for commercial purposes](https://isotope.metafizzy.co/license.html) before publishing your project. Proper use of Isotope is your responsibility.

## Browser support

| Chrome | Safari | IE / Edge | Firefox | Opera |
| ------ | ------ | --------- | ------- | ----- |
| 24+    | 8+     | 11+       | 32+     | 15+   |

### JavaScript plugins

- [Animejs](https://animejs.com/)
- [Headroom.js](https://wicky.nillia.ms/headroom.js/)
- [imagesLoaded](https://imagesloaded.desandro.com/)
- [Isotope](https://isotope.metafizzy.co/)
- [Object Fit Images](https://github.com/fregante/object-fit-images)
- [Inert](https://github.com/WICG/inert)
- [Focus Visible](https://github.com/WICG/focus-visible)
- [Lazysizes](https://github.com/aFarkas/lazysizes)
- [Jarallax](https://github.com/nk-o/jarallax)
- [RxJS](https://rxjs.dev/)
