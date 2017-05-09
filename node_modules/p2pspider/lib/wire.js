'use strict';

exports.__esModule = true;

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _bitfield = require('bitfield');

var _bitfield2 = _interopRequireDefault(_bitfield);

var _bencode = require('bencode');

var _bencode2 = _interopRequireDefault(_bencode);

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BT_RESERVED = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x01]);
var BT_PROTOCOL = new Buffer('BitTorrent protocol');
var PIECE_LENGTH = Math.pow(2, 14);
var MAX_METADATA_SIZE = 10000000;
var EXT_HANDSHAKE_ID = 0;
var BITFIELD_GROW = 1000;
var BT_MSG_ID = 20;

var Wire = function (_stream$Duplex) {
  _inherits(Wire, _stream$Duplex);

  /**
   * constructor
   * @param  {[type]} infohash [description]
   * @return {[type]}          [description]
   */

  function Wire(infohash) {
    _classCallCheck(this, Wire);

    var _this = _possibleConstructorReturn(this, _stream$Duplex.call(this));

    _this._bitfield = new _bitfield2.default(0, {
      grow: BITFIELD_GROW
    });
    _this._infohash = infohash;

    _this._buffer = [];
    _this._bufferSize = 0;

    _this._next = null;
    _this._nextSize = 0;

    _this._metadata = null;
    _this._metadataSize = null;
    _this._numPieces = 0;
    _this._ut_metadata = null;

    _this._onHandshake();
    return _this;
  }

  Wire.prototype._onMessageLength = function _onMessageLength(buffer) {
    var length = buffer.readUInt32BE(0);
    if (length > 0) {
      this._register(length, this._onMessage);
    }
  };

  Wire.prototype._onMessage = function _onMessage(buffer) {
    var _this2 = this;

    this._register(4, function (buffer) {
      return _this2._onMessageLength(buffer);
    });
    if (buffer[0] === BT_MSG_ID) {
      this._onExtended(buffer.readUInt8(1), buffer.slice(2));
    }
  };

  Wire.prototype._onExtended = function _onExtended(ext, buf) {
    if (ext === 0) {
      try {
        this._onExtHandshake(_bencode2.default.decode(buf));
      } catch (e) {}
    } else {
      this._onPiece(buf);
    }
  };

  Wire.prototype._register = function _register(size, next) {
    this._nextSize = size;
    this._next = next;
  };

  Wire.prototype._onHandshake = function _onHandshake() {
    var _this3 = this;

    this._register(1, function (buffer) {
      var pstrlen = buffer.readUInt8(0);
      _this3._register(pstrlen + 48, function (handshake) {
        var protocol = handshake.slice(0, pstrlen);
        if (protocol.toString() !== BT_PROTOCOL.toString()) {
          _this3.end();
          return;
        }
        handshake = handshake.slice(pstrlen);
        if (handshake[5] & 0x10) {
          _this3._sendExtHandshake();
        }
        _this3._register(4, function (buffer) {
          return _this3._onMessageLength(buffer);
        });
      });
    });
  };

  Wire.prototype._onExtHandshake = function _onExtHandshake(extHandshake) {
    if (!extHandshake.metadata_size || !extHandshake.m.ut_metadata || extHandshake.metadata_size > MAX_METADATA_SIZE) {
      return;
    }

    this._metadataSize = extHandshake.metadata_size;
    this._numPieces = Math.ceil(this._metadataSize / PIECE_LENGTH);
    this._ut_metadata = extHandshake.m.ut_metadata;

    this._requestPieces();
  };

  Wire.prototype._requestPieces = function _requestPieces() {
    this._metadata = new Buffer(this._metadataSize);
    for (var piece = 0; piece < this._numPieces; piece++) {
      this._requestPiece(piece);
    }
  };

  Wire.prototype._requestPiece = function _requestPiece(piece) {
    var msg = Buffer.concat([new Buffer([BT_MSG_ID]), new Buffer([this._ut_metadata]), _bencode2.default.encode({ msg_type: 0, piece: piece })]);
    this._sendMessage(msg);
  };

  Wire.prototype._sendPacket = function _sendPacket(packet) {
    this.push(packet);
  };

  Wire.prototype._sendMessage = function _sendMessage(msg) {
    var buf = new Buffer(4);
    buf.writeUInt32BE(msg.length, 0);
    this._sendPacket(Buffer.concat([buf, msg]));
  };

  Wire.prototype.sendHandshake = function sendHandshake() {
    var peerID = _utils2.default.randomID();
    var packet = Buffer.concat([new Buffer([BT_PROTOCOL.length]), BT_PROTOCOL, BT_RESERVED, this._infohash, peerID]);
    this._sendPacket(packet);
  };

  Wire.prototype._sendExtHandshake = function _sendExtHandshake() {
    var msg = Buffer.concat([new Buffer([BT_MSG_ID]), new Buffer([EXT_HANDSHAKE_ID]), _bencode2.default.encode({ m: { ut_metadata: 1 } })]);
    this._sendMessage(msg);
  };

  Wire.prototype._onPiece = function _onPiece(piece) {
    var dict = undefined,
        trailer = undefined;
    try {
      var str = piece.toString();
      var trailerIndex = str.indexOf('ee') + 2;
      dict = _bencode2.default.decode(str.substring(0, trailerIndex));
      trailer = piece.slice(trailerIndex);
    } catch (err) {
      return;
    }
    if (dict.msg_type !== 1) {
      return;
    }
    if (trailer.length > PIECE_LENGTH) {
      return;
    }
    trailer.copy(this._metadata, dict.piece * PIECE_LENGTH);
    this._bitfield.set(dict.piece);
    this._checkDone();
  };

  Wire.prototype._checkDone = function _checkDone() {
    var done = true;
    for (var piece = 0; piece < this._numPieces; piece++) {
      if (!this._bitfield.get(piece)) {
        done = false;
        break;
      }
    }
    if (!done) {
      return;
    }
    this._onDone(this._metadata);
  };

  Wire.prototype._onDone = function _onDone(metadata) {
    try {
      var info = _bencode2.default.decode(metadata).info;
      if (info) {
        metadata = _bencode2.default.encode(info);
      }
    } catch (err) {
      return;
    }
    var infohash = _crypto2.default.createHash('sha1').update(metadata).digest('hex');
    if (this._infohash.toString('hex') !== infohash) {
      return false;
    }
    this.emit('metadata', { info: _bencode2.default.decode(metadata) }, this._infohash);
  };

  Wire.prototype._write = function _write(buf, encoding, next) {
    this._bufferSize += buf.length;
    this._buffer.push(buf);

    while (this._bufferSize >= this._nextSize) {
      var buffer = Buffer.concat(this._buffer);
      this._bufferSize -= this._nextSize;
      this._buffer = this._bufferSize ? [buffer.slice(this._nextSize)] : [];
      this._next(buffer.slice(0, this._nextSize));
    }

    next(null);
  };

  Wire.prototype._read = function _read() {};

  return Wire;
}(_stream2.default.Duplex);

exports.default = Wire;