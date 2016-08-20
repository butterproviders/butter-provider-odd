'use strict';

var Generic = require('butter-provider');
var inherits = require('util').inherits;
var debug = require('debug')('butter-provider-odd');
// because promise <3
var got = require('got');
var _ = require ('lodash');

function Odd(args) {
    if (!(this instanceof Odd)) {
        return new Odd();
    }

    Generic.call(this);

// oddworks vars
    this.apiUri = args.apiUrl || 'http://beta.oddworks.io';
    this.accessToken = args.accessToken || require('./token.json').token;

    debug ('apiURI', this.apiUri);
    debug ('accessToken', this.accessToken);
}
inherits(Odd, Generic);

Odd.prototype.config = {
    name: 'odd',
    uniqueId: 'id',
    tabName: 'Oddworks',
    type: Generic.TabType.ANIME,
    /* should be removed */
    //subtitle: 'ysubs',
    metadata: 'trakttv:movie-metadata'
};


Odd.prototype.call = function (endpoint, headers) {
    // construct method
    var req = {
      method: 'GET',
      url: this.apiUri + endpoint,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'x-access-token': this.accessToken
      }
    };

    // inject additionnal headers
    for (var header in headers) {
      req.headers[header] = headers[header];
    }
    //req.headers = Object.assign(req.headers, headers);

    // actual call
    return got(req.url, req).then(function (response) {
      // return json (parse headers here)
      return JSON.parse(response.body);
    });
}

function formatForButter(data) {
    return data.map(function(d) {
        return {
            id: d.id,
            title: d.attributes.title,
            year: 'FIXME',
            genre: 'FIXME',
            rating: 'FIXME',
            image: d.attributes.images,
            cover: 'FIXME',
            backdrop: 'FIXME',
            torrents: 'FIXME',
            subtitle: 'FIXME',
            trailer: 'FIXME',
            synopsis: 'FIXME',
            type: 'movie'
        }
    });
}

Odd.prototype.fetch = function(filters) {
    var that = this;
    // get main view
    return this.call('/v1/config', {
        'Postman-Token': 'bc5ccbf2-322f-0729-63e2-bbac8e167e6c'
    }).then(function (data) {
        debug(data.links.self, data);
        debug('Device:', data.meta.device);

        // get featureds for this device
        return that.call('/v1/views/' + data.data.attributes.view);
    }).then(function (data) {
        debug(data.links.self, data);
        console.info('featuredMedia', data.data.relationships.featuredMedia);
        console.info('featuredCollections', data.data.relationships.featuredCollections);

        // get video metadata
        return that.call('/v2/videos');
    }).then(function (data) {
        debug(data.links.self, data);
        console.info('available videos:', data.data);
        return data.data;
    }).then(formatForButter)
        .then(function (data) {
//            console.info('bhal', data);
          return {
              results: data,
              hasMore: true
          }
    }).catch(function (err) {
        console.error('urh iz borken', err);
    });
}

Odd.prototype.extractIds = function (items) {
    return _.pluck(items.results, 'imdb_id');
};


Odd.prototype.random = function () {
    console.error ('not implemented');
};

Odd.prototype.detail = function (torrent_id, old_data) {
    return Promise(old_data);
};

module.exports = Odd
