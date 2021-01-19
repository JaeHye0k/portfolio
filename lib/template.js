module.exports = {
    ListButton: function(filelist){
        var buttonList = '<ul class="row justify-content-center w-100 mx-0 list-inline">';
        for(var i=0; i<filelist.length; i++){
            buttonList += `<li class="col-3 col-md-2"><a href="/page/${filelist[i]}"><button type="button" class="Portfolio_TextButton rounded w-100">${filelist[i]}</button></a></li>`;
        }
        buttonList += '</ul>';
        return buttonList;
    },
    ListProject: function(filelist){
        var list = ``;
        for(var i=0; i<filelist.length; i++){
          list += `<div class="col"><div class="card shadow-sm"><a href="/projects?id=${filelist[i]}"><svg class="bd-placeholder-img card-img-top" width="100%" height="225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="#55595c"></rect><text x="50%" y="50%" fill="#eceeef" dy=".3em">Thumbnail</text></svg></a><div class="card-body"><p class="card-text">${filelist[i]}</p><div class="d-flex justify-content-between align-items-center"><div class="btn-group"><button type="button" class="btn btn-sm btn-outline-secondary">View</button></div></div></div></div></div>`;
        }
        return `
          <div class="album py-5">
            <div class="container">
              <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                ${list}
              </div>
            </div>
          </div>
        `;
      },
    HTML: function(buttonList, title, body){
        return `
        <!doctype html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="description" content="Portfolio">
            <meta name="author" content="Lee Jae Hyeok">
            <meta name="generator" content="Hugo 0.79.0">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css" integrity="sha384-giJF6kkoqNQ00vy+HMDP7azOuL0xtbfIcaT9wjKHr8RbDVddVHyTfAAsrekwKmP1" crossorigin="anonymous">
            <link rel="canonical" href="https://getbootstrap.com/docs/5.0/examples/album/">
            <link rel="preconnect" href="https://fonts.gstatic.com">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Titillium+Web&display=swap">
            <link rel="stylesheet" href="css/style.css">
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
            <title>Portfolio - ${title}</title>
          </head>
        <body onload="refresh();">
        <header>
          <div class="navbar navbar-dark bg-dark">
            <div class="container">
              <a href="/" class="homepage navbar-brand d-flex align-items-center">
                <strong>Protfolio</strong>
              </a>
            </div>
          </div>
        </header>
        <main>
          <section class="py-5 text-center container">
            <div class="profile-img rounded-circle p-2">
              <img class="rounded-circle w-100 h-100"src="images/profile.jpg" alt="profile image">
            </div>
            <p class="mt-5">introduction</p>
            <ul class="list-inline mt-5">
              <li class="list-inline-item mx-2">
                <a href="https://github.com/JaeHye0k" target="_blank" class="Portfolio_ContactButton rounded-circle d-inline-flex justify-content-center align-items-center"><svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" style="vertical-align: middle;"><g><path d="m15.8 27.1q0 0.9-0.3 1.9t-1 1.7-1.6 0.7-1.6-0.7-1-1.7-0.2-1.9 0.3-1.8 0.9-1.7 1.6-0.7 1.6 0.7 1 1.7 0.3 1.8z m14.3 0q0 0.9-0.3 1.9t-1 1.7-1.6 0.7-1.6-0.7-1-1.7-0.2-1.9 0.2-1.8 1-1.7 1.6-0.7 1.6 0.7 1 1.7 0.3 1.8z m3.5 0q0-2.6-1.5-4.5t-4.2-1.9q-0.9 0-4.3 0.5-1.6 0.2-3.5 0.2t-3.5-0.2q-3.4-0.5-4.4-0.5-2.6 0-4.2 1.9t-1.5 4.5q0 2 0.7 3.5t1.8 2.3 2.7 1.3 3.2 0.7 3.3 0.1h3.7q1.9 0 3.4-0.1t3.1-0.7 2.7-1.3 1.8-2.3 0.7-3.5z m5-3.9q0 4.6-1.3 7.4-0.9 1.7-2.4 3t-3.1 1.9-3.8 1.1-3.8 0.4-3.8 0.1q-1.7 0-3.1 0t-3.3-0.3-3.4-0.7-3.1-1.1-2.7-1.8-1.9-2.6q-1.4-2.7-1.4-7.4 0-5.3 3-8.8-0.6-1.9-0.6-3.8 0-2.6 1.2-4.9 2.4 0 4.2 0.9t4.2 2.8q3.3-0.8 6.9-0.8 3.3 0 6.3 0.7 2.3-1.8 4.2-2.7t4.2-0.9q1.1 2.3 1.1 4.9 0 1.9-0.6 3.7 3 3.6 3 8.9z"></path></g></svg><span class="d-none">github icon</span></a>
              </li>
              <li class="list-inline-item mx-2">
                <a href="https://www.facebook.com/profile.php?id=100007321035386" target="_blank" class="Portfolio_ContactButton rounded-circle d-inline-flex justify-content-center align-items-center"><svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" style="vertical-align: middle;"><g><path d="m29.4 0.3v5.9h-3.5q-1.9 0-2.6 0.8t-0.7 2.4v4.2h6.6l-0.9 6.6h-5.7v16.9h-6.8v-16.9h-5.7v-6.6h5.7v-4.9q0-4.1 2.3-6.4t6.2-2.3q3.3 0 5.1 0.3z"></path></g></svg><span class="d-none">facebook icon</span></a>
              </li>
              <li class="list-inline-item mx-2">
                <a href="https://codepen.io/jaehye0k" target="_blank" class="Portfolio_ContactButton rounded-circle d-inline-flex justify-content-center align-items-center"><svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" style="vertical-align: middle;"><g><path d="m4.8 26.1l13.5 9v-8l-7.5-5z m-1.4-3.2l4.3-2.9-4.3-2.9v5.8z m18.3 12.2l13.5-9-6-4-7.5 5v8z m-1.7-11l6.1-4.1-6.1-4.1-6.1 4.1z m-9.2-6.2l7.5-5v-8l-13.5 9z m21.5 2.1l4.3 2.9v-5.8z m-3.1-2.1l6-4-13.5-9v8z m10.8-4v12.2q0 0.9-0.8 1.4l-18.2 12.2q-0.5 0.3-1 0.3t-1-0.3l-18.2-12.2q-0.8-0.5-0.8-1.4v-12.2q0-0.9 0.8-1.4l18.2-12.2q0.5-0.3 1-0.3t1 0.3l18.2 12.2q0.8 0.5 0.8 1.4z"></path></g></svg><span class="d-none">codepen icon</span></a>
              </li>
              <li class="list-inline-item mx-2">
                <a href="https://codepen.io/jaehye0k" target="_blank" class="Portfolio_ContactButton rounded-circle d-inline-flex justify-content-center align-items-center"><svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="1em" width="1em" viewBox="0 0 40 40" style="vertical-align: middle;"><g><path d="M 20.00,11.58 C 17.09,11.58 14.38,12.46 12.13,13.96 12.13,13.96 12.13,3.91 12.13,3.50 12.13,1.57 10.79,0.00 8.85,0.00 6.92,0.00 5.79,1.57 5.79,3.50 5.79,3.50 5.79,25.79 5.79,25.79 5.79,33.64 12.15,40.00 20.00,40.00 27.84,40.00 34.21,33.64 34.21,25.79 34.21,17.95 27.84,11.58 20.00,11.58 Z M 20.00,33.66 C 15.65,33.66 12.13,30.14 12.13,25.79 12.13,21.44 15.65,17.92 20.00,17.92 24.35,17.92 27.87,21.44 27.87,25.79 27.87,30.14 24.35,33.66 20.00,33.66 Z"></path></g></svg><span class="d-none">blog icon</span></a>
              </li>
            </ul>
            <div class="w-100 mt-5">
              ${buttonList}
            </div>
          </section>
          <section>
            <h2 class="text-center">${title}</h2>
              ${body}
          </section>
        </main>
        <footer class="text-muted py-5">
            <p class="text-center">Coded by JaeHye0k</p>
        </footer>
        <script>
            function refresh(){
              location.href="#";
            }
        </script>
        </body>
        </html>
        `;
      }
}