betterMail (server)
==================

The aim of this project is to provide a node.js based server, accessible with REST API, for improving the email experience.

Here is the list of goals of the project
* Build an IMAP client, compliant with [rfc 4549](http://www.faqs.org/rfcs/rfc4549.html)
* Make it available through a RESTful web service
* Add intelligence to the system (mainly unsupervised analysis for label assignment)

A betteremail-client parallel project is under developement, but it will not be published until the REST interface of the server will be stably defined

#Installation

In order to install the application you must follow this step:

*  chechout the code from github `git clone git@github.com:artoale/betteremail-server.git`
*  install all the dependencies (listed in package.json) with `npm install`
*  add to the root directory of the repository a `config.json` file like this:

```JSON
{
    "user": "your gmail address",
    "password": "your gmail password",
    "NERDKey": "your key for the NERD framework"
}
```
* start up the server with `node bootstrap`

You may want to change the default name for the databased used. It's configured inside `lib/modules/model.js`

### Annotating emails

To avoid stress on the NERD servers, the funcionality to annotate email with named entity information is not available through the REST APIs of bettermail.

To access this capability use `node lib/modules/annotate`. It will annotate 1500 of your emails in batch of 15, each batch delayed by some seconds.

