# VertNet webapp

Thiss repo contains code for the VertNet webapp.

## Developing

On the server side, VertNet rides on [Google App Engine](https://developers.google.com/appengine) Python 2.7 runtime, so we need to [download and install](https://developers.google.com/appengine/downloads) the latest Python SDK. On the client side it rides on [Twitter Bootstrap](https://github.com/twitter/bootstrap) and [RequireJS](http://requirejs.org/) for pure HTML5, JavaScript, and CSS.

## Getting started

Make sure you have [Git](http://git-scm.com/) installed, and then from the command line:

```bash
$ git clone git@github.com:VertNet/webapp.git
```

That will download the full code repository into a directory named `webapp`.

Since the webapp rides on [Google App Engine](https://developers.google.com/appengine), we can use the local development server. At the command line:

```bash
$ cd webapp
$ dev_appserver.py --clear_search_index --high_replication --use_sqlite -c .
```

Boom! The webapp is now running locally at [http://localhost:8080](http://localhost:8080) and you get an admin console at [http://localhost:8080/_ah/admin](http://localhost:8080/_ah/admin).
