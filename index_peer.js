
var p2pspider = require('p2pspider');
var mysql     = require('mysql');
var bencode     = require('bencode');
var DHT = require('bittorrent-dht')
var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'torrent'
});

var dht = new DHT()

p2pspider({port:6881},function(data){
	
	pool.query('SELECT COUNT(*) AS count FROM `file` where infohash = ?',[data.infohash], function (error, results, fields) {
	if (error) throw error;
	if(results[0].count >0){
		
		dht.announce(data.infohash, 6969, function (err) {
			dht.lookup(data.infohash, function (err, n) {
				pool.query('update file set `count` = ? ,`update_date` = now() where `infohash` = ?',[n,data.infohash], function (error, results, fields) {
				//if (error) throw error;
					console.log('update>>',data.infohash);
				});
			 // dht.destroy()
			})
		})
		
	}else{
		
		let fileinfo = {name:data.name,length:data.size,filse:data.files,peer:data.address+':'+data.port};
		let buf = bencode.encode(data.torrentFileData);
		pool.query('INSERT INTO file VALUES (?, ?, 0, now(), now(), ?)',[data.infohash,JSON.stringify(fileinfo),buf], function (error, results, fields) {
		//if (error) throw error;
			console.log('save>>',data.infohash);
			//console.log(data.torrentFileData);
			
		});
	}
});
//    console.log(data.name);
//console.log('========');
    




})


