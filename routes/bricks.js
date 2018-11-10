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
function removeStrangeChars(unsafeInput){
  return unsafeInput.replace("'","");
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  let fileName = removeStrangeChars(req.query.brickid);
  let filePath = path.join(__dirname,'..',"bricks", fileName+".brick");
  console.log(filePath)
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    if (!err) {     
     res.writeHead(200, {'Content-Type': 'text/html'});

     let brick = JSON.parse(data);
     let formFields = [];
     if(brick.q.indexOf("@")!=-1){
       //interpolate
        let re = new RegExp("@\\w+","gi"); // a @b c -> "@b"
        let variableList = brick.q.match(re);
        for(let variableName of variableList){
          let vname = variableName.replace("@","");
          if(vname in req.query){
            brick.q = brick.q.replace(variableName,removeStrangeChars(req.query[vname]));
          }else{
            formFields.push(vname);
          }
        }
        //are there any fields?
        if(formFields.length >=1){
          //show form
          var dx = "<form method=GET style='padding:20px;margin:20px;border:1px dotted black'>\n"
          for(var field of formFields){
            let theField = "<input type=text name='"+field+"' value='' />\n"
            dx += "<label>" + ucwords(field.replace("_"," "))+"<br/>"+theField+"</label>\n<br/><br/>"
          }
          dx += "<input type=hidden name=brickid value='"+fileName+"' />";
          dx += "<input type=submit value=Send name=_submit />";
          dx += "</form>";
          res.write(dx);
          res.end();
          return;
          //and exit.
        }
     }


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
