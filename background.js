/*	chrome.tabs.onUpdated.addListener(function(tabID,changeInfo,tab){
		if(tab.url.match(/www.google.com\/reader\/view\//i)){
			console.log(changeInfo.status);
            chrome.tabs.sendMessage(tabID, {"status":changeInfo.status} );
        }
	});

      function fetchArxivFeed(request,callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(response) {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                if (xhr.responseXML) {
                  var response=JSON.parse( getTextFromXML(xhr.responseXML,request.arxivID) );
                  callback( response );
                }
            } else {
              console.log('fail in XML: '+xhr.getResponseHeader('Content-Type'));
              callback(null);
            }
          }
        }

        // Note that any URL fetched here must be matched by a permission in
        // the manifest.json file!
        var url = 'http://export.arxiv.org/api/query?id_list='+request.arxivID;
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-Type', 'text/xml');
        xhr.send(null);

      };

      /**
       * Handles data sent via chrome.extension.sendMessage().
       * @param request Object Data sent in the request.
       * @param sender Object Origin of the request.
       * @param callback Function The method to call when the request completes.
       */
 /*     function onMessage(request, sender, callback) {
        // Only supports the 'fetchARXIVFeed' method, although this could be
        // generalized into a more robust RPC system.
        if (request.arxivID) {
          fetchArxivFeed(request,callback);
          return true;
        }
      };

      // Wire up the listener.
      chrome.extension.onMessage.addListener(onMessage);
*/

function getTextFromXML(xml,id) {
  var entry = xml.getElementsByTagName('entry')[0];
  var s = [];
  var i=0;
  s.push('TY  - JOUR'+'\r\n');

  s.push('TI  - ');
  s.push( getElementsValuesByArxivTag(entry,'title') );
  s.push('\r\n');

  i=0;
  var authors=getElementsValuesByArxivTag(entry,'author');
  while(authors[i]){
    s.push('AU  - ');
    s.push( sortAuthorName(authors[i]) );
    s.push('\r\n');
    i++;
  }

  s.push('PY  - ');
  var year= getElementsValuesByArxivTag(entry,'published')[0].substr(0,4);
  s.push(year);
  s.push('\r\n');

  s.push('N2  - ');
  s.push( getElementsValuesByArxivTag(entry,'summary') );
  s.push('\r\n');

  s.push('JF  - ');
  var url_arxiv= getElementsValuesByArxivTag(entry,'id');
  var s_url=url_arxiv.join("");
//  var id=s_url.substring(s_url.search(/abs/i)+4);
  var pURL='http://arxiv.org/pdf/'+id;
  var periodical= 'arXiv:'+id;
  s.push(periodical);
  s.push('\r\n');

  s.push('UR  - ');
  var ur="", doi= getElementsValuesByArxivTag(entry,'doi');
  if( doi.length )
    ur='http://dx.doi.org/'+doi.join("");
  else
    ur=url_arxiv;
  s.push(ur);
  s.push('\r\n');

  s.push('ER  - ');

  var result = s.join("");
  //console.log(result);
  //console.log(pURL);
  //console.log(id);
  var str=' {"citation": "';
  str += jsonFormat(result);
  str += '" , "pdfURL": "';
  str += jsonFormat(pURL);
  str += '" , "arxivID" : "';
  str += jsonFormat(id);
  str += '" } ';
//  console.log(str);
  return str;
}

function getElementsValuesByArxivTag(entry, tag){
    var elements=[];
    var i=0;
    var nodes=entry.getElementsByTagName(tag)
    if(nodes){
        while(nodes[i]){
            if( tag=='author' ){
                //if(nodes[i].childNodes[0].nodeName=='name')
                    elements.push(nodes[i].getElementsByTagName('name')[0].childNodes[0].nodeValue);
            }else{
                elements.push(nodes[i].childNodes[0].nodeValue);
            }
            i++;
        }
    }
    //console.log(elements.join(""));
    return elements;
}

function jsonFormat(str){
    return str.replace(/\\/g,"\\\\").replace(/"/g,"\\\"").replace(/\//g,"\\\/").replace(/\r/g,"\\r").replace(/\n/g,"\\n").replace(/\t/g,"\\t");
}

function sortAuthorName(s)
{
    var index=s.lastIndexOf(" ");
    var lastName=s.substr(index);
    var firstName=s.substring(0,index);
    return lastName+", "+firstName;
}



(function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
    }, i[r].l = 1 * new Date(); a = s.createElement(o),
    m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-91392315-1', 'auto');
ga('set', 'checkProtocolTask', function () { });
ga('require', 'displayfeatures');
ga('send', 'pageview', '/background.html');
