var http = require('http');
var fs = require('fs');
var url = require('url');
var template = require('./lib/template.js');
const express = require('express');
const app = express();
const port = 2000;

app.use(express.static('public'))

app.get('/', (request, response) => {
  fs.readdir('./home_button', 'utf8', function(error, filelist){
    var title = 'homepage';
    var description = 'Hello';
    var buttonList = template.ListButton(filelist);
    var html = template.HTML(buttonList, title ,`<p>${description}</p>`);
    response.send(html);
  });
});
app.get('/page/:pageId', (request, response) => {
  fs.readFile(`home_button/${request.params.pageId}`,'utf8',function(error1, description){
    fs.readdir('./home_button', 'utf8', function(error2, filelist){
        var title = request.params.pageId;
        var buttonList = template.ListButton(filelist);
        if(title === 'projects'){
          fs.readdir(`home_button/projects`,function(error3, filelist){
            var projectList = template.ListProject(filelist);
            var html = template.HTML(buttonList, title, projectList);
            response.send(html);
          });
        }
        else {
          var html = template.HTML(buttonList, title,`<p>${description}</p>`);
          response.send(html);
        }
    });
});
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
/*
http.createServer(function(req,res){
    var _url = req.url;
    var queryData = url.parse(_url,true).query;
    var pathName = url.parse(_url,true).pathname;
    if(pathName === '/'){
      if(queryData.id === undefined){
      }
      else{
    }
    else{
      res.writeHead(404);
      res.end('Not Pound');
    }
}).listen(2000);
*/
