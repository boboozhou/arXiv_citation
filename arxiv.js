/**
 * Get all text nodes at or beneath node n, concatenate the text
 * and return it as a single string.
 * @param {DOMNode} n The node to get the text at
 * @return The concatenated string
 */

function matchNodeName(n,v)
{
	if(n)
		if(n.nodeName==v)
			return true;
	return false;	
}

function matchNodeValue(n,v)
{
	if(n)
		if(n.nodeValue==v)
			return true;
	return false;
}

function matchNodeType(n,v)
{
	if(n)
		if(n.nodeType==v)
			return true;
	return false;
}

function getTitle(n)
{
	if( matchNodeName(n.previousSibling,"SPAN") )
		if(matchNodeValue(n.previousSibling.childNodes[0],"Title:"))
			return 'TI  - ' + n.data + '\r\n';
    return "";
}

function getAuthors(n)
{
	var authors=[];
	if(matchNodeValue(n,"Authors:"))
	{
		var np=n.parentNode;
		var npn;
		for(npn=np.nextSibling;npn!=null;npn=npn.nextSibling)
		{
			if(matchNodeName(npn,"A"))
			{
				authors.push( 'AU  - '+ sortAuthorName(npn.childNodes[0].data) + '\r\n' );
			}
		}
	}

	return authors.join("");
}

function sortAuthorName(s)
{
    var index=s.lastIndexOf(" ");
    var lastName=s.substr(index);
    var firstName=s.substring(0,index);
    return lastName+", "+firstName;
}

function getYear(n)
{
	var index=0, i=n.data.search("Submitted on");
	if(i!=-1)
		for(i;i<n.data.length;++i)
			if(n.data.charAt(i)==' ') 
			{
				++index;
				if(index==4) return 'PY  - '+n.data.substr(i+1,4)+'\r\n';	
			}
	return "";
}

function getAbstract(n)
{
	if( matchNodeName(n.previousSibling,"SPAN") )
		if(matchNodeValue(n.previousSibling.childNodes[0],"Abstract:"))
			return 'N2  - ' + n.data + '\r\n';
    return "";
}

function getPeriodical(n)
{
	var i=n.data.search("arXiv:");
	if(i!=-1)
		if( matchNodeName(n.parentNode,"H1") )
				return 'JF  - '+n.data.substr(3)+'\r\n';
	return "";
}

function getDOI(n)
{
	if(matchNodeValue(n,"DOI"))
		if(matchNodeName(n.parentNode,"ABBR"))
			if(matchNodeName(n.parentNode.parentNode,"TD"))
				if(matchNodeName(n.parentNode.parentNode.nextSibling.nextSibling,"TD"))
				{
					var node=n.parentNode.parentNode.nextSibling.nextSibling.childNodes[0];
					if(matchNodeName(node,"A"))
						if(matchNodeType(node.childNodes[0],3))
							return 'UR  - '+node.href+'\r\n'+'N1  - '+node.childNodes[0].data+'\r\n';
				}
	return "";
}

function getPDFURL(n)
{
	if(n.nodeValue.match("PDF"))
		if(matchNodeName(n.parentNode,"A"))
			if(matchNodeName(n.parentNode.parentNode,"LI"))
            {
                n.parentNode.id="pdfurl";
                return n.parentNode.href;
            }
	return "";
}


function getText(n) {
  var s = [],u="", id="", doi="", pURL="";
  s.push('TY  - JOUR'+'\r\n');
  function getStrings(n, s) {
    var m,tmp;
    if (n.nodeType == 3) { // TEXT_NODE
		s.push(getTitle(n));
		s.push(getAuthors(n));
		s.push(getYear(n));
		s.push(getAbstract(n));
		tmp=getPeriodical(n);
		if(tmp)
		{
			s.push(tmp);
			u=tmp;
            id=u.substring(u.indexOf(":")+1,u.length-2);
		}
		tmp=getDOI(n);
		if(tmp)
		{
			s.push(tmp);
			doi=tmp;
		}
		tmp=getPDFURL(n);
		if(tmp)
			pURL=tmp;
    }
    else if (n.nodeType == 1) { // ELEMENT_NODE
      for (m = n.firstChild; null != m; m = m.nextSibling) {
        getStrings(m, s);
      }
    }
  }
  getStrings(n, s);
  if(!doi)
	s.push('UR  - http://arXiv.org/abs/'+u.substr(12)+'\r\n');
  s.push('ER  - ');
  var result = s.join("");
  //console.log(result);
  return {citation:result,pdfURL:pURL,arxivID:id};
}



var r=getText(document.body);

function onInitFS(fs){
     fs.root.getFile( r.arxivID.replace(/\//g,".")+".ris", {create: true}, function(f){
        f.createWriter( function(writer){
            writer.onwriteend = function(e) {
               console.log('Write completed.');
            };
    
            writer.onerror = function(e) {
               console.log('Write failed: ' + e.toString());
            };	
            
            //window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;          	                          
            //var bb=new BlobBuilder();
    		//bb.append( r.citation );
            //writer.write( bb.getBlob() );
        	var bb=new Blob([r.citation]);
            writer.write( bb );
    
            var pdf=document.getElementById("pdfurl")
            pdf.innerText='PDF';
			pdf.draggable='true';
			pdf.title = "Click to view or drag to download"
                                
            var li=document.createElement('li');
                                    
            var ris = document.createElement('a');
            ris.innerText='Citation';
			ris.href= f.toURL();
			ris.download = "";
			ris.title = "Click to download"
                                    
            li.appendChild(ris);	
            pdf.parentNode.parentNode.insertBefore(li,pdf.parentNode);
                                    
            pdf.addEventListener("dragstart",function(evt){
               evt.dataTransfer.setData("DownloadURL","application/pdf:"+r.arxivID.replace(/\//g,".")+".pdf:"+r.pdfURL);
               },false);
            console.log(r.arxivID);         
    	},errorHandler);          
	 },errorHandler);					
}

function errorHandler(error){
        var msg = '';

        switch (error.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
        };
        console.log(error.toString()+msg);
}

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

window.requestFileSystem(window.TEMPORARY, 1024000 /* ~1MB */, onInitFS, errorHandler);
	
