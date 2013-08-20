/**
 * This file is part of VertNet: https://github.com/VertNet/webapp
 * 
 * VertNet is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * VertNet is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see: http://www.gnu.org/licenses
 */
{
    baseUrl: 'js',
    appDir: '../www',
    mainConfigFile: '../www/js/main.js',
    dir: '../www-built',
    paths: {
        jquery: 'lib/jquery',
        underscore: 'lib/underscore',
        backbone: 'lib/backbone',
        mps: 'lib/minpubsub',
        spin: 'lib/spin',
        bootstrap: 'lib/bootstrap',
        backbonequeryparams: 'lib/backbone.queryparams',
        cartodb: 'lib/cartodb',
        store: 'lib/store',
        app: 'app/app',
        router: 'app/router',
        rpc: 'app/rpc',
        map: 'app/map',
        text: 'app/text',
        util: 'app/util',
        views: 'app/views',
        models: 'app/models'
      },
    modules: [
        {
            name: 'main'
        }
    ]
}
