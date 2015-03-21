//utility scripts
//Evan Andrews
//FIXME: include

function eUtil() {

  //Get URL Parameters by name
  function getUrlParam(name){
     if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
  }

}

