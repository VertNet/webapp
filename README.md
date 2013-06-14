# VertNet webapp

This repo contains code for the VertNet webapp.

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

# License

![](http://www.gnu.org/graphics/lgplv3-147x51.png)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, [see here](http://www.gnu.org/licenses/).
