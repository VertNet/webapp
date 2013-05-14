define([
  'occurrence-search-view'
], function(
  view
) {

  TestCase('occurrenceSearchViewTest', {

    testMessageShouldBeDefined: function() {
      assertEquals(view.isNewSearch([], ['puma concolor']), false);
    }

  });

});
