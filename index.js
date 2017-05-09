
var p2pspider = require('p2pspider');
var mysql     = require('mysql');
var bencode     = require('bencode');
var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'torrent'
});



p2pspider({port:6881},function(data){
	pool.query('SELECT COUNT(*) AS count FROM `file` where infohash = ?',[data.infohash], function (error, results, fields) {
	if (error) throw error;
	if(results[0].count >0){
		pool.query('update file set `count` = `count`+1 ,`update_date` = now() where `infohash` = ?',[data.infohash], function (error, results, fields) {
		if (error) throw error;
			console.log('update>>',data.infohash);
		});
	}else{
		let fileinfo = {name:data.name,length:data.size,filse:data.files,peer:data.address+':'+data.port};
		let buf = bencode.encode(data.torrentFileData);
		pool.query('INSERT INTO file VALUES (?, ?, 0, now(), now(), ?)',[data.infohash,JSON.stringify(fileinfo),buf], function (error, results, fields) {
		if (error) throw error;
			console.log('save>>',data.infohash);
			//console.log(data.torrentFileData);
			
		});
	}
});
//    console.log(data.name);
//console.log('========');
    




})


