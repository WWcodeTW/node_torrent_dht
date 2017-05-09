'use strict';

exports.__esModule = true;

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KTable = function () {
  /**
   * [constructor description]
   * @param  {[type]} maxsize [description]
   * @return {[type]}         [description]
   */

  function KTable() {
    var maxsize = arguments.length <= 0 || arguments[0] === undefined ? 10 : arguments[0];

    _classCallCheck(this, KTable);

    this.nid = _utils2.default.randomID();
    this.nodes = [];
    this.maxsize = maxsize;
  }
  /**
   * push node
   * @param  {[type]} node [description]
   * @return {[type]}      [description]
   */


  KTable.prototype.push = function push(node) {
    if (this.nodes.length >= this.maxsize) {
      return;
    }
    this.nodes.push(node);
  };

  return KTable;
}();

exports.default = KTable;