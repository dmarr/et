var App = Ember.Application.create({ LOG_TRANSITIONS: true, LOG_BINDINGS: true }); 

App.Store = DS.Store.extend( { 
  adapter: 'DS.FixtureAdapter',
  revision: 12 
});

DS.FixtureAdapter.reopen({

    queryFixtures: function(fixtures, query, type) {
        var maxResults = query.maxResults;
        var startIndex = query.startIndex;

        if ('undefined' !== typeof maxResults && 'undefined' !== typeof startIndex) {
            return fixtures.slice(startIndex - 1, maxResults);
        } else if ('undefined' !== typeof maxResults) {
            return fixtures.slice(0, maxResults);
        } else if ('undefined' !== typeof startIndex) {
            return fixtures.slice(startIndex - 1); 
        } else {
            return fixtures;
        }
        
    }


});

App.Article = DS.Model.extend({
  promoHeadline: DS.attr('string'),
  promoImage: DS.attr('string'),
  body: DS.attr('string')

});

App.ArticlesRoute = Ember.Route.extend({
  model: function(params) {
      return App.Article.find({ maxResults: 10 });
  }
});


App.Author = DS.Model.extend({
  displayName: DS.attr('string')
});

App.Router.map(function() {
    this.resource('articles');
});

App.ArticlesController = Ember.ArrayController.extend({
  currentPage: 1,
  
  canLoadMore: true,

  loadMore: function() {
    var self = this;
    if (self.get('canLoadMore')) {
      self.set('isLoading', true);
      $.getJSON('articles.json', function(data) {
        self.get('store').load(self.type, data);
      }).then(function() {
        self.set('isLoading', false);
      });
    } else {
      self.set('isLoading', false);
    }
  }
});


App.IndexRoute = Ember.Route.extend({
    setupController: function() {
        this.controllerFor('index').set('model',
            App.Article.find({ maxResults: 10 })
        );
    }
});

App.Article.FIXTURES = [];

Ember.LoadMoreView = Ember.View.extend({ 
    templateName: 'loadMore', 
    didInsertElement: function() { 
        var view = this; 
        this.$().bind('inview', function(event, isInView, visiblePartX, visiblePartY) { 
            if (isInView) Ember.tryInvoke(view.get('controller'), 'loadMore'); 
        });
    }
});
