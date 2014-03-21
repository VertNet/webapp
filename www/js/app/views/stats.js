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

// Defines the view for the stats page.
define([
  'jquery',
  'backbone',
  'underscore',
  'util',
  'text!views/stats.html',
  'mps',
  'rpc',
  'map'
  ], function ($, Backbone, _, util, template, mps, rpc, map) {
    return Backbone.View.extend({

      initialize: function(options, app) {
        this.app = app;
        this.template = _.template(template);
        mps.publish('spin', [true]);
      }, 

      render: function() {
        this.$el.html(_.template(template));       
        
        console.log("About to call stats from JS");
        
        rpc.execute('/service/stats', 
          {}, {
          success: _.bind(function(outp) {
          }, this),
          error: _.bind(function(error) {
            console.log(error);
            var mindate = error.responseText.split("|")[0];
            var maxdate = error.responseText.split("|")[1];
            var queries = util.addCommas(error.responseText.split("|")[2]);
            var qrecords = util.addCommas(error.responseText.split("|")[3]);
            var downloads = util.addCommas(error.responseText.split("|")[4]);
            var drecords = util.addCommas(error.responseText.split("|")[5]);

            var explInstData = error.responseText.split("|")[6].split("], [")
            var explInstArray = [['Institution Code', 'Queries']];
            for (i in explInstData) {
                var vals = explInstData[i]
                if (vals[0] == '[') vals = vals.substring(1);
                if (vals[vals.length-1] == ']') vals = vals.substring(0, vals.length-1);
                var vals2 = vals.split(", ");
                vals2[0] = vals2[0].substring(1,vals2[0].length-1);
                vals2[1] = parseInt(vals2[1]);
                explInstArray.push(vals2);
            }
            
            var explClassData = error.responseText.split("|")[7].split("], [")
            var explClassArray = [['Class', 'Queries']];
            for (i in explClassData) {
                var vals = explClassData[i]
                if (vals[0] == '[') vals = vals.substring(1);
                if (vals[vals.length-1] == ']') vals = vals.substring(0, vals.length-1);
                var vals2 = vals.split(", ");
                vals2[0] = vals2[0].substring(1,vals2[0].length-1);
                vals2[1] = parseInt(vals2[1]);
                explClassArray.push(vals2);
            }
            
            var downloadsData = error.responseText.split("|")[8].split("], [")
            var downloadsArray = [['Date', 'Downloads']];
            for (i in downloadsData) {
                var vals = downloadsData[i]
                if (vals[0] == '[') vals = vals.substring(1);
                if (vals[vals.length-1] == ']') vals = vals.substring(0, vals.length-1);
                var vals2 = vals.split(", ");
                vals2[0] = vals2[0].substring(1,vals2[0].length-1);
                vals2[1] = parseInt(vals2[1]);
                downloadsArray.push(vals2);
            }
            
            var timespan = 'From '+mindate+' to '+maxdate;
            
            this.$('#timespan').text(timespan);
            this.$('#queries').text(queries);
            this.$('#qrecords').text(qrecords);
            this.$('#downloads').text(downloads);
            this.$('#drecords').text(drecords);
            
            map.init(_.bind(function() {
                var explInstPieData = google.visualization.arrayToDataTable(explInstArray);
                var explInstPieOptions = {title: "Number times somebody searched for a particular institution using the \"institutioncode\" label"};
                var explInstPieChart = new google.visualization.PieChart(document.getElementById("explInstPie_chart_div"));
                explInstPieChart.draw(explInstPieData, explInstPieOptions);
                
                var explClassPieData = google.visualization.arrayToDataTable(explClassArray);
                var explClassPieOptions = {title: "Number times somebody searched for a particular class using the \"class\" label"};
                var explClassPieChart = new google.visualization.PieChart(document.getElementById("explClassPie_chart_div"));
                explClassPieChart.draw(explClassPieData, explClassPieOptions);
                
                var downloadData = google.visualization.arrayToDataTable(downloadsArray);
                var downloadOptions = {title: "Number of Downloads, per month", legend: "none"};
                var downloadChart = new google.visualization.LineChart(document.getElementById("download_chart_div"));
                downloadChart.draw(downloadData, downloadOptions);
                
            }, this));
            
            mps.publish('spin', [false]);
          }, this)
        });
        return this;
      },

      setup: function() {
        mps.publish('spin', [true]);
      }
  });
});
