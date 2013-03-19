var get = Ember.get, set = Ember.set;

var adapter, store, serializer, ajaxUrl, ajaxType, ajaxHash;
var Person, person, people;
var Role, role, roles;
var Group, group;

module("Orion REST adapter", {
  setup: function() {
    ajaxUrl = undefined;
    ajaxType = undefined;
    ajaxHash = undefined;

    var Adapter = Orion.Adapter.extend();
    Adapter.configure('plurals', {
      person: 'people'
    });

    adapter = Adapter.create({
      ajax: function(url, type, hash) {
        var success = hash.success, self = this;

        ajaxUrl = url;
        ajaxType = type;
        ajaxHash = hash;

        if (success) {
          hash.success = function(json) {
            success.call(self, json);
          };
        }
      }
    });

    serializer = get(adapter, 'serializer');

    store = DS.Store.create({
      adapter: adapter,
      revision: 12
    });

    Person = DS.Model.extend({
      name: DS.attr('string')
    });

    Person.toString = function() {
      return "App.Person";
    };

    Group = DS.Model.extend({
      name: DS.attr('string'),
      people: DS.hasMany(Person)
    });

    Group.toString = function() {
      return "App.Group";
    };

    Person.reopen({
      group: DS.belongsTo(Group)
    });

    Role = DS.Model.extend({
      name: DS.attr('string')
    });

    Role.toString = function() {
      return "App.Role";
    };
  },

  teardown: function() {
    if (person) {
      person.destroy();
      person = null;
    }

    adapter.destroy();
    store.destroy();
  }
});

var expectUrl = function(url, desc) {
  equal(ajaxUrl, url, "the URL is " + desc);
};

var expectType = function(type) {
  equal(type, ajaxType, "the HTTP method is " + type);
};

var expectData = function(hash) {
  deepEqual(hash, ajaxHash.data, "the hash was passed along");
};

var expectState = function(state, value, p) {
  p = p || person;

  if (value === undefined) { value = true; }

  var flag = "is" + state.charAt(0).toUpperCase() + state.substr(1);
  equal(get(p, flag), value, "the person is " + (value === false ? "not " : "") + state);
};

var expectStates = function(state, value) {
  people.forEach(function(person) {
    expectState(state, value, person);
  });
};

test("creating a person makes a POST to /people, with the data hash", function() {
  person = store.createRecord(Person, { name: "Tom Dale" });

  expectState('new');
  store.commit();
  expectState('saving');

  expectUrl("/people", "the collection at the plural of the model name");
  expectType("POST");
  expectData({ name: "Tom Dale" });

  ajaxHash.success({ id: 1, name: "Tom Dale" });
  expectState('saving', false);

  equal(person, store.find(Person, 1), "it is now possible to retrieve the person by the ID supplied");
});

test("updating a person makes a PUT to /people/:id with the data hash", function() {
  store.load(Person, { id: 1, name: "Yehuda Katz" });

  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  set(person, 'name', "Brohuda Brokatz");

  expectState('dirty');
  store.commit();
  expectState('saving');

  expectUrl("/people/1", "the plural of the model name with its ID");
  expectType("PUT");

  ajaxHash.success({ id: 1, name: "Brohuda Brokatz" });
  expectState('saving', false);

  equal(person, store.find(Person, 1), "the same person is retrieved by the same ID");
  equal(get(person, 'name'), "Brohuda Brokatz", "the hash should be updated");
});

test("updates are not required to return data", function() {
  store.load(Person, { id: 1, name: "Yehuda Katz" });

  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  set(person, 'name', "Brohuda Brokatz");

  expectState('dirty');
  store.commit();
  expectState('saving');

  expectUrl("/people/1", "the plural of the model name with its ID");
  expectType("PUT");

  ajaxHash.success();
  expectState('saving', false);

  equal(person, store.find(Person, 1), "the same person is retrieved by the same ID");
  equal(get(person, 'name'), "Brohuda Brokatz", "the data is preserved");
});

test("deleting a person makes a DELETE to /people/:id", function() {
  store.load(Person, { id: 1, name: "Tom Dale" });

  person = store.find(Person, 1);

  expectState('new', false);
  expectState('loaded');
  expectState('dirty', false);

  person.deleteRecord();

  expectState('dirty');
  expectState('deleted');
  store.commit();
  expectState('saving');

  expectUrl("/people/1", "the plural of the model name with its ID");
  expectType("DELETE");

  ajaxHash.success();
  expectState('deleted');
});

test("finding all people makes a GET to /people", function() {
  people = store.find(Person);

  expectUrl("/people", "the plural of the model name");
  expectType("GET");

  ajaxHash.success({
    totalCount: 1,
    entries: [{ id: 1, name: "Yehuda Katz" }]
  });

  person = people.objectAt(0);

  expectState('loaded');
  expectState('dirty', false);

  equal(person, store.find(Person, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("finding all people with since makes a GET to /people", function() {
  people = store.find(Person);

  expectUrl("/people", "the plural of the model name");
  expectType("GET");

  ajaxHash.success({ total_count: 1, entries: [{ id: 1, name: "Yehuda Katz" }] });

  people = store.find(Person);

  expectUrl("/people", "the plural of the model name");
  expectType("GET");
//  expectData({since: '123'});

  ajaxHash.success({ total_count: 1, entries: [{ id: 2, name: "Paul Chavard" }] });

  person = people.objectAt(1);

  expectState('loaded');
  expectState('dirty', false);

  equal(person, store.find(Person, 2), "the record is now in the store, and can be looked up by ID without another Ajax request");

  people.update();

  expectUrl("/people", "the plural of the model name");
  expectType("GET");
//  expectData({since: '1234'});

  ajaxHash.success({ total_count: 1, entries: [{ id: 3, name: "Dan Gebhardt" }] });

  equal(people.get('length'), 3, 'should have 3 records now');
});

test("finding a person by ID makes a GET to /people/:id", function() {
  person = store.find(Person, 1);

  expectState('loaded', false);
  expectUrl("/people/1", "the plural of the model name with the ID requested");
  expectType("GET");

  ajaxHash.success({ person: { id: 1, name: "Yehuda Katz" } });

  expectState('loaded');
  expectState('dirty', false);

  equal(person, store.find(Person, 1), "the record is now in the store, and can be looked up by ID without another Ajax request");
});

test("finding a person by an ID-alias populates the store", function() {
  person = store.find(Person, 'me');

  expectState('loaded', false);
  expectUrl("/people/me", "the plural of the model name with the ID requested");
  expectType("GET");

  ajaxHash.success({ person: { id: 1, name: "Yehuda Katz" } });

  expectState('loaded');
  expectState('dirty', false);

  equal(person, store.find(Person, 'me'), "the record is now in the store, and can be looked up by the alias without another Ajax request");
});

test("finding people by a query", function() {
  var people = store.find(Person, { page: 1 });

  equal(get(people, 'length'), 0, "there are no people yet, as the query has not returned");

  expectUrl("/people", "the collection at the plural of the model name");
  expectType("GET");
  expectData({ page: 1 });

  ajaxHash.success({
    entries: [
      { id: 1, name: "Rein Heinrichs" },
      { id: 2, name: "Tom Dale" },
      { id: 3, name: "Yehuda Katz" }
    ]
  });

  equal(get(people, 'length'), 3, "the people are now loaded");

  var rein = people.objectAt(0);
  equal(get(rein, 'name'), "Rein Heinrichs");
  equal(get(rein, 'id'), 1);

  var tom = people.objectAt(1);
  equal(get(tom, 'name'), "Tom Dale");
  equal(get(tom, 'id'), 2);

  var yehuda = people.objectAt(2);
  equal(get(yehuda, 'name'), "Yehuda Katz");
  equal(get(yehuda, 'id'), 3);

  people.forEach(function(person) {
    equal(get(person, 'isLoaded'), true, "the person is being loaded");
  });
});

test("creating several people (with bulkCommit) makes a POST to /people, with a data hash Array", function() {
  set(adapter, 'bulkCommit', true);

  var tom = store.createRecord(Person, { name: "Tom Dale" });
  var yehuda = store.createRecord(Person, { name: "Yehuda Katz" });

  people = [ tom, yehuda ];

  expectStates('new');
  store.commit();
  expectStates('saving');

  expectUrl("/people", "the collection at the plural of the model name");
  expectType("POST");
  expectData({ people: [ { name: "Tom Dale" }, { name: "Yehuda Katz" } ] });

  ajaxHash.success({ entries: [ { id: 1, name: "Tom Dale" }, { id: 2, name: "Yehuda Katz" } ] });
  expectStates('saving', false);

  equal(tom, store.find(Person, 1), "it is now possible to retrieve the person by the ID supplied");
  equal(yehuda, store.find(Person, 2), "it is now possible to retrieve the person by the ID supplied");
});


test("updating several people (with bulkCommit) makes a PUT to /people/bulk with the data hash Array", function() {
  set(adapter, 'bulkCommit', true);

  store.loadMany(Person, [
    { id: 1, name: "Yehuda Katz" },
    { id: 2, name: "Carl Lerche" }
  ]);

  var yehuda = store.find(Person, 1);
  var carl = store.find(Person, 2);

  people = [ yehuda, carl ];

  expectStates('new', false);
  expectStates('loaded');
  expectStates('dirty', false);

  set(yehuda, 'name', "Brohuda Brokatz");
  set(carl, 'name', "Brocarl Brolerche");

  expectStates('dirty');
  store.commit();
  expectStates('saving');

  expectUrl("/people/bulk", "the collection at the plural of the model name");
  expectType("PUT");
  expectData({ people: [{ id: 1, name: "Brohuda Brokatz" }, { id: 2, name: "Brocarl Brolerche" }] });

  ajaxHash.success({ entries: [
    { id: 1, name: "Brohuda Brokatz" },
    { id: 2, name: "Brocarl Brolerche" }
  ]});

  expectStates('saving', false);

  equal(yehuda, store.find(Person, 1), "the same person is retrieved by the same ID");
  equal(carl, store.find(Person, 2), "the same person is retrieved by the same ID");
});

test("deleting several people (with bulkCommit) makes a PUT to /people/bulk", function() {
  set(adapter, 'bulkCommit', true);

  store.loadMany(Person, [
    { id: 1, name: "Yehuda Katz" },
    { id: 2, name: "Carl Lerche" }
  ]);

  var yehuda = store.find(Person, 1);
  var carl = store.find(Person, 2);

  people = [ yehuda, carl ];

  expectStates('new', false);
  expectStates('loaded');
  expectStates('dirty', false);

  yehuda.deleteRecord();
  carl.deleteRecord();

  expectStates('dirty');
  expectStates('deleted');
  store.commit();
  expectStates('saving');

  expectUrl("/people/bulk", "the collection at the plural of the model name with 'delete'");
  expectType("DELETE");
  expectData({ people: [1, 2] });

  ajaxHash.success();

  expectStates('saving', false);
  expectStates('deleted');
  expectStates('dirty', false);
});

test("if you specify a namespace then it is prepended onto all URLs", function() {
  set(adapter, 'namespace', 'ember');
  person = store.find(Person, 1);
  expectUrl("/ember/people/1", "the namespace, followed by the plural of the model name and the id");

  store.load(Person, { id: 1 });
});

test("if you specify a url then that custom url is used", function() {
  set(adapter, 'url', 'http://api.ember.dev');
  person = store.find(Person, 1);
  expectUrl("http://api.ember.dev/people/1", "the custom url, followed by the plural of the model name and the id");

  store.load(Person, { id: 1 });
});

test("data loaded from the server is converted from underscores to camelcase", function() {
  Person.reopen({
    lastName: DS.attr('string')
  });

  store.load(Person, { id: 1, name: "Tom", last_name: "Dale" });

  var person = store.find(Person, 1);

  equal(person.get('name'), "Tom", "precond - data was materialized");
  equal(person.get('lastName'), "Dale", "the attribute name was camelized");
});

test("When a record with a belongsTo is saved the foreign key should be sent.", function () {
  var PersonType = DS.Model.extend({
    title: DS.attr("string"),
    people: DS.hasMany(Person)
  });

  PersonType.toString = function() {
    return "App.PersonType";
  };

  Person.reopen({
    personType: DS.belongsTo(PersonType)
  });

  store.load(PersonType, {id: 1, title: "Developer"});
  var personType = store.find(PersonType, 1);

  var person = store.createRecord(Person, {name: 'Sam Woodard', personType: personType});

  store.commit();

  expectUrl('/people');
  expectType("POST");
  expectData({ name: "Sam Woodard", person_type_id: "1" });
  ajaxHash.success({ name: 'Sam Woodard', person_type_id: 1});
});

test("creating a record with a 422 error marks the records as invalid", function(){
  person = store.createRecord(Person, { name: "" });
  store.commit();

  var mockXHR = {
    status:       422,
    responseText: JSON.stringify({ errors: { name: ["can't be blank"]} })
  };

  ajaxHash.error.call(ajaxHash.context, mockXHR);

  expectState('valid', false);
  deepEqual(person.get('errors'), { name: ["can't be blank"]}, "the person has the errors");
});

test("updating a record with a 422 error marks the records as invalid", function(){
  store.load(Person, { id: 1, name: "John Doe" });
  person = store.find(Person, 1);
  person.set('name', '');
  store.commit();

  var mockXHR = {
    status:       422,
    responseText: JSON.stringify({ errors: { name: ["can't be blank"]} })
  };

  ajaxHash.error.call(ajaxHash.context, mockXHR);

  expectState('valid', false);
  deepEqual(person.get('errors'), { name: ["can't be blank"]}, "the person has the errors");
});

test("creating a record with a 500 error marks the record as error", function() {
  person = store.createRecord(Person, { name: "" });
  store.commit();

  var mockXHR = {
    status:       500,
    responseText: 'Internal Server Error'
  };

  ajaxHash.error.call(ajaxHash.context, mockXHR);

  expectState('error');
});

test("updating a record with a 500 error marks the record as error", function() {
  store.load(Person, { id: 1, name: "John Doe" });
  person = store.find(Person, 1);
  person.set('name', 'Jane Doe');
  store.commit();

  var mockXHR = {
    status:       500,
    responseText: 'Internal Server Error'
  };

  ajaxHash.error.call(ajaxHash.context, mockXHR);

  expectState('error');
});

