# This is a Web Interface for the Aurum Data Discovery Project

----
## Requirements
* [NodeJS](https://nodejs.org)
* React Developer Tools for [Chrome] (https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) or [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
* ~~The [Aurum Backend](https://github.com/mitdbg/aurum-datadiscovery/) up and running~~

> It's also nice to have Javascript Babel for ES6 installed in your text editor. Download for [Sublime Text] (https://packagecontrol.io/packages/Babel) or [Atom](https://atom.io/packages/language-babel)

----
## Start Project
$ `npm install`
$ `npm run watch`

## Build for Production
$ `npm run build`

## Testing
* In React Dev Tools, select the Search component
* $r.setState({ userQuery: 'foo'})
* $r.handleResponse('bar')
* Notice the crazy number of times `Graph.componentDidUpdate` and `Pandas.componentDidUpdate` were called.