var App = Ember.Application.create({ LOG_TRANSITIONS: true }); 

App.Store = DS.Store.extend( { 
  adapter: 'DS.FixtureAdapter',
  revision: 12 
});

App.Article = DS.Model.extend({
  title: DS.attr('string'),
  author: DS.belongsTo('App.Author')
});

App.Author = DS.Model.extend({
  displayName: DS.attr('string'),
  articles: DS.hasMany('App.Article')
});

App.Article.FIXTURES = [
  { id: 1, title: 'article 1', author_id: 1 },
  { id: 2, title: 'article 2', author_id: 1 }
];

App.Author.FIXTURES = [
  { id: 1, displayName: 'author 1', article_ids: [1,2] }
];

App.Router.map(function() {
    this.resource('articles');
});

App.IndexRoute = Ember.Route.extend({
    setupController: function() {
        this.controllerFor('index').set('model',
            App.Article.find()
        );    
    }
});
