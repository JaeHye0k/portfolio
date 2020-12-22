var projects = {
  'name':["Project1","Project2","Project3","Project4","Project5","Project6","Project7","Project8","Project9"],
  'create':function(name){
    for(var i=0; i<projects.name.length; i++){
     document.write("<div class='col'><div class='card shadow-sm'><a href='Projects/"+name[i]+".html' target='_blank'><svg class='bd-placeholder-img card-img-top' width='100%' height='225' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='Placeholder: Thumbnail' preserveAspectRatio='xMidYMid slice' focusable='false'><title>Placeholder</title><rect width='100%' height='100%' fill='#55595c'></rect><text x='50%' y='50%' fill='#eceeef' dy='.3em'>Thumbnail</text></svg></a><div class='card-body'><p class='card-text'>"+name[i]+"</p><div class='d-flex justify-content-between align-items-center'><div class='btn-group'><button type='button' class='btn btn-sm btn-outline-secondary'>View</button><button type='button' class='btn btn-sm btn-outline-secondary'>Edit</button></div><small class='text-muted'>9 mins</small></div></div></div></div>");
     }
  }
}
projects.create(projects.name);
