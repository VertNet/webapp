/*
 * Occurrence search result collection.
 */

define([
  'collections/boiler/list',
  'models/occ-search-row'
], function (List, Model) {
  return List.extend({

    model: Model

  });
});
