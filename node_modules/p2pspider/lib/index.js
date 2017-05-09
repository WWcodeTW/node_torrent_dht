'use strict';

exports.__esModule = true;

var _dht = require('./dht');

var _dht2 = _interopRequireDefault(_dht);

var _btclient = require('./btclient');

var _btclient2 = _interopRequireDefault(_btclient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var callback = arguments[1];


  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var btclient = new _btclient2.default({ timeout: options.options || 1000 * 10 });

  btclient.on('complete', function (metadata, infohash, rinfo) {
    var data = metadata;
    data.address = rinfo.address;
    data.port = rinfo.port;
    data.infohash = infohash.toString('hex');
    data.magnet = 'magnet:?xt=urn:btih:' + data.infohash;

    if (callback) {
      callback(data);
    } else {
      console.log(data.name, data.magnet);
    }
  });

  _dht2.default.start({
    btclient: btclient,
    address: '0.0.0.0',
    port: options.port || 6219,
    nodesMaxSize: options.nodesMaxSize || 4000 // 值越大, 网络, 内存, CPU 消耗就越大, 收集速度会变慢.
  });
};

module.exports = exports.default;