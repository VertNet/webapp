define([
  'greeting'
], function(
  greeting
) {

  TestCase('greetingTest', {

    testMessageShouldBeDefined: function() {
      assertNotUndefined('greeting.message should be defined', greeting.message);
    },

    testMessageShouldGreetTheWorld: function() {
      assertEquals('greeting.message should greet the world', 'Hello world!', greeting.message);
    }

  });

});
