'use strict';

exports.__esModule = true;

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _isUtf = require('is-utf8');

var _isUtf2 = _interopRequireDefault(_isUtf);

var _iconvLite = require('iconv-lite');

var _iconvLite2 = _interopRequireDefault(_iconvLite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  /**
   * get random id
   * @return {[type]} [description]
   */
  randomID: function randomID() {
    return _crypto2.default.createHash('sha1').update(_crypto2.default.randomBytes(20)).digest();
  },
  /**
   * decode nodes data
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  decodeNodes: function decodeNodes(data) {
    var nodes = [];
    for (var i = 0; i + 26 <= data.length; i += 26) {
      nodes.push({
        nid: data.slice(i, i + 20),
        address: data[i + 20] + '.' + data[i + 21] + '.' + data[i + 22] + '.' + data[i + 23],
        port: data.readUInt16BE(i + 24)
      });
    }
    return nodes;
  },

  /**
   * get neighbor id
   * @param  {[type]} target [description]
   * @param  {[type]} nid    [description]
   * @return {[type]}        [description]
   */
  genNeighborID: function genNeighborID(target, nid) {
    return Buffer.concat([target.slice(0, 10), nid.slice(10)]);
  },

  /**
   * to utf8 string
   * @param  {[type]} buffer [description]
   * @return {[type]}        [description]
   */
  toUtf8String: function toUtf8String(buffer) {
    if ((0, _isUtf2.default)(buffer)) {
      return buffer.toString();
    }
    return _iconvLite2.default.decode(buffer, 'GB18030');
  }
};