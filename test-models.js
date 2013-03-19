Site.Article = DS.Model.extend({
    type:DS.attr('string'),
    path:DS.attr('string'),
    url: DS.attr('string'),
    headline: DS.attr('string'),
    promoHeadline: DS.attr('string'),
    promoImage: DS.attr('string'),
    locale: DS.attr('string'),
    deck: DS.attr('string'),
    section: DS.attr('string'),
    author: DS.belongsTo('Site.Author'),
    assigneeId: DS.attr('string'),
    status: DS.attr('string'),
    body: DS.attr('string'),
  //  tags: DS.attr('tags'),
    allowComments: DS.attr('boolean'),
    mediaPropertyId: DS.attr('string'),
    publishedAt: DS.attr('date'),
    lastEditedOn: DS.attr('date')
});
Site.Author = DS.Model.extend({
    article: DS.hasMany('Site.Article'),
    path: DS.attr('string'),
    url: DS.attr('string'),
    mediaPropertyId: DS.attr('string'),
    displayName: DS.attr('string'),
    email: DS.attr('string'),
    avatar: DS.attr('string'),
    bio: DS.attr('string'),
    homepageUrl: DS.attr('string')
});
