
var adapter, store;
module("Site Store", {
    setup: function() {
        Ember.Namespace.create({ name: 'Site' });
        DS.Adapter.configure('Site.Article', {
            primaryKey: "_id"
        });
        store = DS.Store.create({ adapter: "DS.FixtureAdapter", revision: 12 });
    },
    teardown: function() {
        store.destroy();
    }
});

test('loading json', function() {

    store.load(Site.Article, {
        id:893,
        type:"news",
        path:"welcoming-huddler",
        headline:"Welcoming Huddler",
        promoImage:"msanchez2.jpg",
        section:"",
        status:"published",
        body:"<p>There are a number of reasons why this partnership makes sense for Say, and I want to take the time to highlight the three most important ones here:<strong><strong><br /></strong></strong></p>\r\n<ul>\r\n<li dir=\"ltr\"><span>It makes our network stronger</span><span>. The 30 sites in the Huddler portfolio will account for 25-30% of our overall network delivery.</p>",
        tags:["a", "b"],
        author_id:22,
        mediaPropertyId:'me016bb0b83f05860f',
        publishedAt:new Date(),
        lastEditedOn:new Date()
    });


    var article = store.find(Site.Article, 893); 
    equal(article.get('type'), 'news', 'Store loads article type');

    store.load(Site.Author, {
        id: 22, displayName: "David Marr", article_ids: [893]
    });

    var author = store.find(Site.Author, 22);
    equal(author.get('displayName'), 'David Marr', 'Author is found.');
    equal(article.get('author.displayName'), 'David Marr', 'Author is found on Article.');

    author.set('displayName', "dmarr");
    equal(author.get('displayName'), 'dmarr', 'Author is set');
    equal(article.get('author.displayName'), "dmarr", "Author is set on Article");
});
