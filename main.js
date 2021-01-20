var http = require('http');
var fs = require('fs');
var url = require('url');
var template = require('./lib/template.js');
const express = require('express');
const app = express();
const port = 2000;

app.use(express.static('public'));

app.get('/', (request, response) => {
  fs.readdir('./pages', 'utf8', function(error, filelist){
    var title = 'homepage';
    var description = 'Hello';
    var buttonList = template.ListButton(filelist);
    var html = template.HTML(buttonList, title ,`<p>${description}</p>`);
    response.send(html);
  });
});

app.get('/pages/:pageId', (request, response) => {
  fs.readdir('./pages', 'utf8', function(err1, filelist){
    fs.readFile(`./pages/${request.params.pageId}`,'utf8',function(err2, description){
      var title = request.params.pageId;
      var buttonList = template.ListButton(filelist);
      if(title === 'projects'){
        fs.readdir(`./pages/projects`,function(err3, filelist){
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

app.use(function(req, res, next) {
  res.status(404).send('404 Not Found');
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
