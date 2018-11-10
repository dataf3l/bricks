// vim: expandtab sw=2 ts=2
var express = require('express');
var fs = require('fs');
var path = require('path');
var router = express.Router();
const { Client } = require('pg')

function ucwords(text){
  var words = text.split(" ");
  for(var wordid in words){
    words[wordid] = words[wordid].charAt(0).toUpperCase() + words[wordid].substring(1);
  }
  return words.join(" ");
}

function table(data){
  var dx = "<table border=1 cellspacing=0 cellpadding=2>";
  //headers
  if(data.length>0){
    dx += "<tr>";
    for(let column in data[0]){
      dx += "\n\t<th>";
      dx += ucwords(column.replace("_"," "));
      dx += "</th>";
    }
    dx += "</tr>\n";
  }
  //print data
  for(let rowid in data){
    let row = data[rowid];
    dx += "<tr>\n";
    for(let column in row){
      dx += "\n\t<td>";
      dx += row[column];
      dx += "</td>";
    }
    dx += "</tr>\n";
  }
  dx += "</table>";
  return dx;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  let fileName = req.query.brickid + ".brick";
  let filePath = path.join(__dirname,'..',"bricks", fileName);
  console.log(filePath)
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
           
     let brick = JSON.parse(data);
     //res.write(brick.q);
     res.writeHead(200, {'Content-Type': 'text/html'});

     const client = new Client({
       user: 'postgres',
       host: 'localhost',
       database: 'bricks',
       password: 'postgres',
       port: 5432,
      });
      
      client.connect();

      client.query(brick.q, [], (err, dbres) => {
        if(err){
          console.log("QUERY FAILED:" + brick.q);
          console.log(err);
          res.write("query failed :(");
          res.end();
          client.end();
          return;
        }
        let output = "";
        if("title" in brick){
          output += "<h1>" + brick.title + "</h1>";
        }
        output += table(dbres.rows);
        res.write(output);
        res.end();
        client.end();

      });

    } else {
        res.send('Brick does not exist.');
        res.end();
        console.log(err);
    }
  });

});

module.exports = router;
