/**
 * force.js 
 * ~ the 6th generation -- project F (foxtrot)
 * authored by 9r3i
 * https://github.com/9r3i
 * started at november 12th 2022
 * continued at december 1st 2022 - v1.2.0 - cache control
 * continued at december 13th 2022 - v1.3.0 - cache age; 1 day
 * continued at december 21st 2022 - v1.4.0
 *   - replace .on__some_event__ with addEventListener
 *   - fix conflict css dialog, splash and loader with bootstrap
 *   - add method fontCSS, string of arialnarrow font/ttf data
 */
;const Force=function(){
/* release version */
Object.defineProperty(this,'version',{
  value:'1.4.1',
  writable:false,
});
this.host=null; /* force stream host */
this.pkey=null; /* force privilege key */
this.loadedApp=null; /* current loaded app */
const _Force=this; /* constant to this object */
/* ============ apps requires @get, 2 others ============ */
/**
 * app -- return object
 * @parameters
 *   ns     = string of app namespace (required)
 *   root   = string of app root; default: apps (local)
 *   config = mixed of config for inner app (optional)
 * @requires
 *   this.get
 *   this.alert
 *   this.loadScript
 * @methods
 *   init = async function
 */
this.app=function(ns,root,config){
  config=typeof config==='object'&&config!==null?config:{};
  this.loaderCSS();
  this.dialogCSS();
  return {
    root:typeof root==='string'?root:'apps',
    namespace:ns,
    config:config,
    Force:this,
    init:async function(){
      var ns=this.namespace,
      root=this.root,
      path=`${root}/${ns}/${ns}.js`,
      vpath=`apps/${ns}/${ns}.js`,
      script=this.Force.virtualFile(vpath);
      if(!script){
        script=await this.Force.get(path);
        if(typeof script!=='string'
          ||/^error/i.test(script)){
          await this.Force.alert('Error: Failed to load "'
            +ns+'" app file.');
          return false;
        }
        this.Force.virtualFile(vpath,script);
      }else if(this.cacheExpired()){
        var _app=this;
        this.Force.get(path).then(r=>{
          _app.Force.virtualFile(vpath,r);
        });
      }
      this.Force.virtualFileClearance();
      this.Force.loadScript(script,'force-app-'+ns);
      if(!window.hasOwnProperty(ns)
        ||typeof window[ns]!=='function'){
        await this.Force.alert('Error: Invalid app "'
          +ns+'" script.');
        return false;
      }
      this.Force.plugin.config=this.config;
      const napp=new window[ns](this);
      if(napp.hasOwnProperty('init')
        &&typeof napp.init==='function'){
        this.Force.loadedApp=napp;
        return napp.init();
      }return napp;
    },
    cacheExpired:function(){
      var tage='cache/age.txt',
      cage=86400000, /* 1 day */
      vage=this.Force.virtualFile(tage),
      nage=(new Date).getTime();
      if(this.config.hasOwnProperty('force')
        &&this.config.force.hasOwnProperty('cache')
        &&this.config.force.cache.hasOwnProperty('age')){
        cage=parseInt(this.config.force.cache.age,10);
      }
      var mage=nage+cage;
      if(!vage){
        vage=this.Force.virtualFile(tage,mage.toString());
        return true;
      }
      var age=parseInt(vage,10);
      if(age<nage){
        vage=this.Force.virtualFile(tage,mage.toString());
        return true;
      }return false;
    },
  };
};
/* ============ plugin requires @get, 3 others ============ */
/**
 * plugin object
 * @requires
 *   this.get
 *   this.alert
 *   this.loadScript
 *   this.loadStyleFile
 * @methods
 *   init       = function
 *   prepare    = async function
 *   register   = function
 *   loadScript = function
 */
this.plugin={
  root:'plugins',
  plug:[],
  param:{},
  hosts:{},
  Force:this,
  config:{},
  /* initialize all plugins */
  init:function(){
    for(var ns of this.plug){
      var plug=new window[ns](this.param[ns]);
      if(plug.hasOwnProperty('init')
        &&typeof plug.init==='function'){
        plug.init(this);
      }
    }return this;
  },
  /* prepare all plugins -- root path -- async */
  prepare:async function(root,cb){
    cb=typeof cb==='function'?cb:function(){};
    root=typeof root==='string'?root:this.root;
    this.root=root;
    var loaded=0;
    cb({loaded:loaded,total:this.plug.length});
    for(var ns of this.plug){
      loaded++;
      var _plug=this,
      host=this.hosts.hasOwnProperty(ns)?this.hosts[ns]:root;
      path=`${host}/${ns}/${ns}.js`,
      vpath=`plugins/${ns}/${ns}.js`,
      pathCSS=`${host}/${ns}/${ns}.css`,
      vpathCSS=`plugins/${ns}/${ns}.css`,
      script=this.Force.virtualFile(vpath),
      style=this.Force.virtualFile(vpathCSS);
      if(!script){
        script=await this.Force.get(path);
        style=await this.Force.get(pathCSS);
        if(typeof script!=='string'
          ||/^error/i.test(script)){
          await this.Force.alert('Error: Invalid plugin "'+ns+'".');
          continue;
        }
        this.Force.virtualFile(vpath,script);
        this.Force.virtualFile(vpathCSS,style);
      }else if(this.cacheExpired()){
        var _plug=this;
        this.Force.get(path).then(r=>{
          _plug.Force.virtualFile(vpath,r);
          _plug.Force.loadScript(r,'force-plugin-'+ns);
        });
        this.Force.get(pathCSS).then(r=>{
          _plug.Force.virtualFile(vpathCSS,r);
          _plug.Force.loadStyle(r,'force-plugin-style-'+ns);
        });
      }
      this.Force.loadScript(script,'force-plugin-'+ns);
      this.Force.loadStyle(style,'force-plugin-style-'+ns);
      if(!window.hasOwnProperty(ns)
        ||typeof window[ns]!=='function'){
        await this.Force.alert('Error: Invalid plugin "'+ns+'".');
        continue;
      }
      /* progress callback */
      cb({loaded:loaded,total:this.plug.length});
    }return this;
  },
  cacheExpired:function(){
    var tage='cache/age.txt',
    cage=86400000, /* 1 day */
    vage=this.Force.virtualFile(tage),
    nage=(new Date).getTime(),
    mage=nage+cage;
    if(this.config.hasOwnProperty('force')
      &&this.config.force.hasOwnProperty('cache')
      &&this.config.force.cache.hasOwnProperty('age')){
      cage=parseInt(this.config.force.cache.age,10);
    }
    if(!vage){
      vage=this.Force.virtualFile(tage,mage.toString());
      return true;
    }
    var age=parseInt(vage,10);
    if(age<nage){
      vage=this.Force.virtualFile(tage,mage.toString());
      return true;
    }return false;
  },
  /* plugin register -- namespace, parameter and host */
  register:function(ns,pr,host){
    if(typeof ns==='string'
      &&/^[a-zA-Z][a-zA-Z0-9_]+$/.test(ns)
      &&this.plug.indexOf(ns)<0){
      this.plug.push(ns);
      this.param[ns]=typeof pr==='undefined'?null:pr;
      if(typeof host==='string'){
        this.hosts[ns]=host;
      }
    }else if(Array.isArray(ns)){
      for(var nx of ns){
        if(Array.isArray(nx)&&nx.length>0){
          this.plug.push(nx[0]);
          this.param[nx[0]]=nx.length>1?nx[1]:null;
          if(nx.length>2&&typeof nx[2]==='string'){
            this.hosts[nx[0]]=nx[2];
          }
        }else if(typeof nx==='string'){
          this.plug.push(nx);
          this.param[nx]=null;
        }
      }
    }return this;
  },
};
/* ============ get/fetch/post requires @stream ============ */
/**
 * get -- post using promise
 * @requires:
 *   this.post
 * @parameters:
 *   url = string of url
 *   upl = function of upload callback
 *   dnl = function of download callback
 *   dta = object of data to be queried in url
 * 
 * @usage:
 * async function(){
 *   var data=await _Force.get(url,upload,download);
 *   return data;
 * }
 */
this.get=function(url,upl,dnl,dta){
  return new Promise(resolve=>{
    _Force.post('_Force.get',r=>{
      resolve(r);
    },dta,{
      method:'GET',
      upload:upl,
      download:dnl,
      host:url,
    });
  });
};
/**
 * fetch -- post using promise
 * @requires:
 *   this.post
 * @parameters:
 *   mt = string of method of object class; *required
 *   dt = object of data request
 *   cf = object of other configs
 *        method    = string of request method; default: POST
 *        host      = string of host (overwrite this.host)
 *        headers   = object of headers
 *        upload    = function of upload callback
 *        download  = function of download callback
 *        underfour = function of underfour callback
 * 
 * @usage:
 * async function(){
 *   var data=await _Force.fetch(method,data,config);
 *   return data;
 * }
 */
this.fetch=function(mt,dt,cf){
  return new Promise(resolve=>{
    _Force.post(mt,r=>{
      resolve(r);
    },dt,cf);
  });
};
/**
 * post -- using stream
 * @requires:
 *   this.stream
 *   this.buildQuery
 *   this.temp
 *   this.host (variable/required); overwritten by cf.host
 *   this.pkey (variable/optional)
 * @parameters:
 *   mt = string of method of object class; *required
 *   cb = function of callback
 *   dt = object of data request
 *   cf = object of other configs
 *        method    = string of request method; default: POST
 *        host      = string of host
 *        headers   = object of headers
 *        upload    = function of upload callback
 *        download  = function of download callback
 *        underfour = function of underfour callback
 * @usage:
 *   
 */
this.post=function(mt,cb,dt,cf){
  cb=typeof cb==='function'?cb:function(){};
  if(typeof mt!=='string'){return this.temp(cb);}
  dt=typeof dt==='object'&&dt!==null?dt:{};
  cf=typeof cf==='object'&&cf!==null?cf:{};
  dt.method=mt;
  dt.token=(Math.floor((new Date).getTime()/0x3e8)+(0x5*0x3c))
    .toString(0x24);
  var mtd=cf.hasOwnProperty('method')?cf.method:'POST',
      hdr=cf.hasOwnProperty('headers')?cf.headers:null,
      upl=cf.hasOwnProperty('upload')?cf.upload:null,
      dnl=cf.hasOwnProperty('download')?cf.download:null,
      ud4=cf.hasOwnProperty('underfour')?cf.underfour:null,
      ur=cf.hasOwnProperty('host')
          &&typeof cf.host==='string'?cf.host:this.host,
      qr=/\?/.test(ur)?'&':'?',
      ud=this.buildQuery(dt),
      tmp=false;
  if(this.pkey&&mtd=='POST'){
    dt.pkey=this.pkey;
  }
  ur+=mtd=='GET'?qr+ud:'';
  return this.stream(ur,cb,cb,dt,hdr,upl,dnl,mtd,ud4);
  /* ------> @stream: url,cb,er,dt,hd,ul,dl,mt,ud4 */
};
/* ============ alert requires stand-alone ============ */
/**
 * alert -- using promise
 * @requires:
 *   this.dialog
 *   this.dialogAlert
 * @parameters:
 *   text = string of message text
 * -----
 * @usage:
 * async function(){
 *   return await _Force.alert('OK');
 * }
 * -----
 */
this.alert=function(text){
  return new Promise(resolve=>{
    _Force.dialogAlert(text,e=>{
      resolve(e);
    });
  });
};
/**
 * confirm -- using promise
 * @requires:
 *   this.dialog
 *   this.dialogConfirm
 * @parameters:
 *   text = string of message text
 * -----
 * @usage:
 * async function(){
 *   return await _Force.confirm('Are you sure?');
 * }
 * -----
 */
this.confirm=function(text){
  return new Promise(resolve=>{
    _Force.dialogConfirm((e,d)=>{
      resolve(e);
    },text);
  });
};
/**
 * prompt -- using promise
 * @requires:
 *   this.dialog
 *   this.dialogPrompt
 * @parameters:
 *   text = string of message text; default: blank
 *   def  = string of default input; default: blank
 * -----
 * @usage:
 * async function(){
 *   return await _Force.prompt('Insert Name','Your Name');
 * }
 * -----
 */
this.prompt=function(text,def){
  return new Promise(resolve=>{
    _Force.dialogPrompt((e,d)=>{
      resolve(e);
    },text,def);
  });
};
/* dialog alert */
this.dialogAlert=function(text,cb){
  cb=typeof cb==='function'?cb:function(){};
  this.dialog(text,false,'Alert','OK',false,function(e){
    cb(e);
  });
};
/* dialog confirm */
this.dialogConfirm=function(cb,text){
  cb=typeof cb==='function'?cb:function(){};
  this.dialog(text,true,'Confirm','No',false)
    .addButton(cb,'Yes','red').show();
};
/* alert -- prompt */
this.dialogPrompt=function(cb,text,def,type,holder){
  cb=typeof cb==='function'?cb:function(){};
  def=typeof def==='string'?def:'';
  type=typeof type==='string'?type:'text';
  holder=typeof holder==='string'?holder:'';
  this.dialog(text,true,'Prompt','Cancel')
    .addInput(cb,def,type,holder).show();
};
/* ============ basic requires stand-alone ============ */
/* virtual file clearance -- 3 fingers gesture */
this.virtualFileClearance=function(){
  window.VIRTUAL_FILE_CLEARANCE=false;
  window.addEventListener('touchmove',async function(e){
    if(e.changedTouches.length>=0x03
      &&!window.VIRTUAL_FILE_CLEARANCE){
      window.VIRTUAL_FILE_CLEARANCE=true;
      var text='Clear all Force caches?',
      yes=await _Force.confirm(text);
      window.VIRTUAL_FILE_CLEARANCE=false;
      if(!yes){return false;}
      _Force.splash('All caches has been cleared.');
      return _Force.virtualFile(false);
    }
  },false);
};
/**
 * dialog -- november 10th 2022
 * @requires: 
 *   this.buildElement
 *   this.parseJSON
 *   this.dialogCSS for style
 * @parameters:
 *   text   = string of text message; *required
 *   hold   = bool of hold to show; default: false
 *   title  = string of title; default: Alert
 *   oktext = string of ok text button; default: OK
 *   bgtap  = bool of background tap to close; default: false

Usage confirm:
  var cp=this.dialog('Delete this file?',false,'Confirm','No')
    .addButton(function(e,d){
      _Force.splash(d.answer);
    },'Yes','red').show();
  _Force.splash(cp.answer); // has to be wait
  
Usage prompt:
  var pr=this.dialog('Insert your text!',true,'Prompt','Cancel')
    .addInput(function(e,d){
      _Force.splash(e);
    },'Default Value','text','Insert Text').show();
  _Force.splash(cp.input.value); // has to be wait
*/
this.dialog=function(text,hold,title,oktext,bgtap,cb){
  title=typeof title==='string'?title:'Alert';
  oktext=typeof oktext==='string'?oktext:'OK';
  cb=typeof cb==='function'?cb:function(){};
  var ptext=typeof text==='string'?text
    :typeof this.parseJSON==='function'
      ?this.parseJSON(text):JSON.stringify(text),
  old=document.getElementById('force-dialog'),
  oldbg=document.getElementById('force-dialog-background'),
  dt=this.buildElement('div',null,{
    'class':'force-dialog-title',
    'data-text':title,
  }),
  dtx=this.buildElement('div',null,{
    'class':'force-dialog-text'
      +(typeof text==='string'?'':' force-dialog-text-left'),
    'data-text':ptext,
  }),
  dtxt=this.buildElement('div',null,{
    'class':'force-dialog-text-out',
  },[dtx]),
  dbo=this.buildElement('div',null,{
    'class':'force-dialog-button',
    'data-text':oktext,
    'data-type':'ok',
  }),
  dbot=this.buildElement('div',null,{
    'class':'force-dialog-button-out',
  },[dbo]),
  dbg=this.buildElement('div',null,{
    'class':'force-dialog-background',
    'id':'force-dialog-background',
  }),
  d=this.buildElement('div',null,{
    'class':'force-dialog',
    'id':'force-dialog',
  },[
    dt,dtxt,dbot,
  ]),
  fix=false;
  if(old){old.parentNode.removeChild(old);}
  if(oldbg){oldbg.parentNode.removeChild(oldbg);}
  d.bg=dbg;
  d.button=dbo;
  d.buttonOut=dbot;
  d.buildElement=this.buildElement;
  d.answer=null;
  d.textOut=dtxt;
  dbg.dialog=d;
  dbo.dialog=d;
  dbo.callback=cb;
  dbo.text=text;
  d.close=function(){
    this.bg.remove();
    this.classList.remove('force-dialog-show');
    var dialog=this;
    setTimeout(e=>{
      dialog.remove();
    },300);
    this.answer=false;
    return this;
  };
  d.show=function(){
    this.appendTo(document.body);
    var dialog=this;
    setTimeout(e=>{
      dialog.classList.add('force-dialog-show');
      dialog.bg.appendTo(document.body);
    },100);
    return this;
  };
  dbo.addEventListener('click',function(e){
    this.dialog.close();
    return this.callback(this.text,this.dialog);
  });
  dbg.addEventListener('click',function(e){
    if(bgtap){
      this.dialog.close();
    }
  });
  /* add button */
  d.addButton=function(cb,btext,clr){
    cb=typeof cb==='function'?cb:function(){};
    btext=typeof btext==='string'?btext:'Submit';
    clr=typeof clr==='string'?clr:'blue';
    var nbut=this.buildElement('div',null,{
      'class':'force-dialog-button force-dialog-button-left force-dialog-button-'+clr,
      'data-text':btext,
    });
    this.buttonOut.insertBefore(nbut,this.button);
    nbut.dialog=this;
    nbut.addEventListener('click',function(e){
      this.dialog.close();
      this.dialog.answer=true;
      return cb(true,this.dialog);
    });
    this.button.addEventListener('click',function(e){
      this.dialog.close();
      return cb(false,this.dialog);
    });
    return this;
  };
  /* add input */
  d.addInput=function(cb,def,type,holder){
    cb=typeof cb==='function'?cb:function(){};
    def=typeof def==='string'?def:'';
    type=typeof type==='string'?type:'text';
    holder=typeof holder==='string'?holder:'';
    var input=this.buildElement('input',null,{
      'class':'force-dialog-input',
      'type':type,
      'value':def,
      'placeholder':holder,
      'data-touch':'first',
    }),
    nbut=this.addButton(function(e,d){
      if(!e){return cb(false,d);}
      return cb(input.value,d);
    });
    input.appendTo(this.textOut);
    input.addEventListener('focus',function(e){
      if(this.dataset.touch=='first'){
        this.select();
        this.dataset.touch='last';
      }
    });
    this.input=input;
    return this;
  };
  /* show or slide down */
  if(hold!==true){
    d.show();
  }
  /* return the dialog */
  return d;
};
/* splash message -- requires this.parseJSON */
this.splash=function(str,t,limit){
  var j=false,id='force-splash',
      div=document.getElementById(id);
  if(typeof str!=='string'){
    str=this.parseJSON(str,limit);
    j=true;
  }
  if(div){div.parentNode.removeChild(div);}
  if(window.SPLASH_TIMEOUT){
    clearTimeout(window.SPLASH_TIMEOUT);
  }
  div=document.createElement('div');
  div.innerText=str;
  div.id=id;
  div.classList.add('force-splash');
  div.style.textAlign=j?'left':'center';
  if(str.match(/[\u0600-\u06ff]/ig)){
    div.style.direction='rtl';
    div.style.fontFamily='arabic';
    div.style.fontSize='125%';
    div.style.textAlign='right';
  }else{
    div.style.width='auto';
  }
  div.style.left='-100vw';
  document.body.appendChild(div);
  var dw=div.offsetWidth/2;
  div.style.left='calc(50vw - '+dw+'px)';
  if(div){div.addEventListener('contextmenu',this.absorbEvent);}
  var tt=t?(t*0x3e8):0xbb8;
  window.SPLASH_TIMEOUT=setTimeout(function(e){
    var div=document.getElementById(id);
    if(!div){return false;}
    div.style.top='-100vh';
    setTimeout(function(e){
      if(!div){return false;}
      div.parentNode.removeChild(div);
    },0x5dc);
  },tt);
};
/**
 * parse json to string
 * @require: this.objectLength
 * @parameters:
 *   obj   = mixed data of json; could be object or else
 *   limit = int of nest limit; default: 1
 *   space = int of space; default: 0
 *   pad   = int of first space per line; default: 2
 */
this.parseJSON=function(obj,limit,space,pad){
  var rtext='';  
  space=space?parseInt(space,10):0;
  limit=limit?parseInt(limit,10):1;
  pad=pad?parseInt(pad,10):2;
  if((typeof obj==='object'&&obj!==null)
    ||Array.isArray(obj)){
    var start=Array.isArray(obj)?'[':'{',
        end=Array.isArray(obj)?']':'}';
    if(space==0){
      rtext+=(' ').repeat(pad*space)+''+start+'\r\n';
    }
    var len=this.objectLength(obj),counter=0;
    for(var i in obj){
      counter++;
      var comma=counter<len?',':'',e=obj[i],espace=space+2;
      if((typeof e==='object'&&e!==null)
        ||Array.isArray(e)){
        var estart=Array.isArray(e)?'[':'{',
            eend=Array.isArray(e)?']':'}',
            k=start==='{'?'"'+i+'" : ':'';
        rtext+=(' ').repeat(pad*espace)+''+k+estart+'\r\n';
        if((espace/2)<limit){
          rtext+=this.parseJSON(e,limit,espace,pad);
        }else{
          rtext+=(' ').repeat(pad*(espace+2))+'[***LIMITED:'+limit+'***]\r\n';
        }
        rtext+=(' ').repeat(pad*espace)+''+eend+comma+'\r\n';
      }else if(typeof e==='string'||typeof e==='number'){
        var k=typeof e==='number'?e.toString():'"'+e+'"';
        i=start==='{'?'"'+i+'" : ':'';
        rtext+=(' ').repeat(pad*espace)+''+i+k+comma+'\r\n';
      }else if(typeof e==='boolean'){
        var k=e===true?'true':'false';
        i=start==='{'?'"'+i+'" : ':'';
        rtext+=(' ').repeat(pad*espace)+''+i+k+comma+'\r\n';
      }else if(e===null){
        i=start==='{'?'"'+i+'" : ':'';
        rtext+=(' ').repeat(pad*espace)+''+i+'null'+comma+'\r\n';
      }else{
        var k='"['+(typeof e)+']"';
        i=start==='{'?'"'+i+'" : ':'';
        rtext+=(' ').repeat(pad*espace)+''+i+k+comma+'\r\n';
      }
    }
    if(space==0){
      rtext+=(' ').repeat(pad*space)+''+end+'\r\n';
    }
  }else if(typeof obj==='string'){
    rtext+=(' ').repeat(pad*space)+'"'+obj+'"\r\n';
  }else if(typeof obj==='number'){
    rtext+=(' ').repeat(pad*space)+''+obj.toString()+'\r\n';
  }else if(typeof obj==='boolean'){
    rtext+=(' ').repeat(pad*space)+''+(obj===true?'true':'false')+'\r\n';
  }else if(obj===null){
    rtext+=(' ').repeat(pad*space)+'null\r\n';
  }else{
    rtext+=(' ').repeat(pad*space)+'"['+(typeof obj)+']"\r\n';
  }return rtext;
};
/**
 * stream
 * @require: this.buildQuery
 * @parameters:
 *   url = string of url
 *   cb  = function of success callback of response code 200
 *   er  = function of error callback
 *   dt  = object of data form
 *   hd  = object of headers
 *   ul  = function of upload progress
 *   dl  = function of download progress
 *   mt  = string of method
 *   ud4 = function of under-four ready-state
 * @return: void
 */
this.stream=function(url,cb,er,dt,hd,ul,dl,mt,ud4){
  /* prepare callbacks */
  cb=typeof cb==='function'?cb:function(){};
  er=typeof er==='function'?er:function(){};
  ul=typeof ul==='function'?ul:function(){};
  dl=typeof dl==='function'?dl:function(){};
  ud4=typeof ud4==='function'?ud4:function(){};
  /* prepare xhr --> xmlhttp */
  var xmlhttp=false;
  if(window.XMLHttpRequest){
    xmlhttp=new XMLHttpRequest();
  }else{
    /* older browser xhr */
    var xhf=[
      function(){return new ActiveXObject("Msxml2.XMLHTTP");},
      function(){return new ActiveXObject("Msxml3.XMLHTTP");},
      function(){return new ActiveXObject("Microsoft.XMLHTTP");}
    ];
    for(var i=0;i<xhf.length;i++){try{xmlhttp=xhf[i]();}catch(e){continue;}break;}
  }
  /* check xhr */
  if(!xmlhttp){return er('Error: Failed to build XML http request.');}
  /* set method */
  var mts=['GET','POST','PUT','OPTIONS','HEAD','DELETE'];
  mt=typeof mt==='string'&&mts.indexOf(mt)>=0?mt
    :typeof dt==='object'&&dt!==null?'POST':'GET';
  /* open xhr connection */
  xmlhttp.open(mt,url,true);
  /* build urlencoded form data */
  if(typeof dt==='object'&&dt!==null){
    if(typeof dt.append!=='function'){
      xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
      dt=this.buildQuery(dt);
    }
  }
  /* set headers */
  if(typeof hd=='object'&&hd!=null){
    for(var i in hd){xmlhttp.setRequestHeader(i,hd[i]);}
  }
  /* set callback for upload and download */
  xmlhttp.upload.addEventListener('progress',ul,false);
  xmlhttp.addEventListener("progress",dl,false);
  /* xhr ready state change */
  xmlhttp.addEventListener('readystatechange',function(e){
    if(xmlhttp.readyState===4&&xmlhttp.status===200
      &&typeof xmlhttp.responseText==='string'){
      try{var res=JSON.parse(xmlhttp.responseText);}
      catch(e){var res=xmlhttp.responseText;}
      return cb(res);
    }else if(xmlhttp.readyState===4){
      return er('Error: '+xmlhttp.status+' - '
        +(xmlhttp.status===0?'No Connection':xmlhttp.statusText));
    }else if(xmlhttp.readyState<4){
      return ud4('Force::stream--> '+xmlhttp.readyState+' '+xmlhttp.status+' '+xmlhttp.statusText);
    }return er('Error: '+xmlhttp.status+' '+xmlhttp.statusText);
  },false);
  /* send XHR */
  xmlhttp.send(dt);
};
/* ============ stand-alone ============ */
/* on function ready
 * @parameters:
 *   fn = string of function name
 *   cb = function of callback on done
 *   cr = integer of counter, auto-generated
 * @return: boolean, executer in one second
 */
this.onFunctionReady=function(fn,cb,cr){
  cr=cr?parseInt(cr):0;
  cb=typeof cb==='function'?cb:function(){};
  if(typeof fn!=='string'){return cb(false);}
  if(window.hasOwnProperty(fn)||cr>0x03){
    var res=window.hasOwnProperty(fn)
      &&typeof window[fn]==='function'?true:false;
    return cb(res);
  }cr++;
  return setTimeout(function(){
    _Force.onFunctionReady(fn,cb,cr);
  },0x64);
};
/* storage for virtual files
 * @parameters
 *   f = string of filename, or false to clear all virtual files
 *   c = string of content, or false to delete
 */
this.virtualFile=function(f,c){
  const p='force/virtual/',
  r=/^force\/virtual\//,
  k=p+''+f.toString();
  if(f===false){
    for(var i=0;i<localStorage.length;i++){
      var v=localStorage.key(i);
      if(v.match(r)){
        localStorage.removeItem(v);
      }
    }return true;
  }else if(typeof c==='string'){
    localStorage.setItem(k,c);
    return true;
  }else if(typeof c===false){
    localStorage.removeItem(k);
    return true;
  }return localStorage.getItem(k);
};
/* is script loaded
 * @parameters:
 *   f = string of file name or path
 * @return: boolean
 */
this.isScriptLoaded=function(f){
  if(typeof f!=='string'){return false;}
  var s=document.querySelector('script[id="'+f+'"]');
  return s?true:false;
};
/* load script from file */
this.loadScriptFile=function(f){
  if(typeof f!=='string'){return false;}
  var j=document.createElement('script');
  j.type='text/javascript';
  j.async=true;
  j.id=f;
  j.src=f;
  document.head.appendChild(j);
  return j;
};
/* load script from string */
this.loadScript=function(s,i){
  if(typeof s!=='string'){return;}
  var id=i?i:Math.ceil((new Date).getTime()*Math.random());
  var j=document.createElement('script');
  j.type='text/javascript';
  j.async=true;
  j.id=id;
  j.textContent=s;
  document.head.appendChild(j);
  return j;
};
/* load style from file */
this.loadStyleFile=function(f){
  if(typeof f!=='string'){return false;}
  var j=document.createElement('link');
  j.type='text/css';
  j.rel='stylesheet';
  j.media='screen,print';
  j.async=true;
  j.id=f;
  j.href=f+'?id='+f;
  document.head.appendChild(j);
  return j;
};
/* load style from string */
this.loadStyle=function(s,i){
  if(typeof s!=='string'){return;}
  var id=i?i:Math.ceil((new Date).getTime()*Math.random());
  var j=document.createElement('style');
  j.id=id;
  j.type='text/css';
  j.rel='stylesheet';
  j.media='screen,print';
  j.textContent=s;
  document.head.appendChild(j);
  return j;
};
/* load module from file */
this.loadModuleFile=function(f){
  if(typeof f!=='string'){return false;}
  var j=document.createElement('script');
  j.type='module';
  j.async=true;
  j.defer=true;
  j.id=f;
  j.src=f;
  document.head.appendChild(j);
  return j;
};
/* load module script from string */
this.loadModule=function(s,i){
  if(typeof s!=='string'){return;}
  var id=i?i:Math.ceil((new Date).getTime()*Math.random());
  var j=document.createElement('script');
  j.type='module';
  j.id=id;
  j.textContent=s;
  document.head.appendChild(j);
  return j;
};
/* clear elements -- v221112 */
this.clearElement=function(el){
  if(typeof el!=='object'||el===null
    ||typeof el.removeChild!=='function'){return false;}
  var i=el.childNodes.length;
  while(i--){
    el.removeChild(el.childNodes[i]);
  }return true;
};
/* build element */
this.buildElement=function(tag,text,attr,children,html,content){
  var div=document.createElement(typeof tag==='string'?tag:'div');
  div.appendTo=function(el){
    if(typeof el==='object'&&el!==null
      &&typeof el.appendChild==='function'){
      el.appendChild(this);
      return true;
    }return false;
  };
  div.remove=function(){
    if(!this.parentNode
      ||typeof this.parentNode.removeChild!=='function'){
      return;
    }this.parentNode.removeChild(this);
  };
  if(typeof text==='string'){
    div.innerText=text;
  }
  if(typeof attr==='object'&&attr!==null){
    for(var i in attr){
      div.setAttribute(i,attr[i]);
    }
  }
  if(Array.isArray(children)){
    for(var i=0;i<children.length;i++){
      if(typeof children[i]==='object'
        &&children[i]!==null
        &&typeof children[i].appendChild==='function'){
        div.appendChild(children[i]);
      }
    }
  }
  if(typeof html==='string'){
    div.innerHTML=html;
  }
  if(typeof content==='string'){
    div.textContent=content;
  }
  div.args={
    tag:tag,
    text:text,
    attr:attr,
    children:children,
    html:html,
    content:content,
  };
  return div;
};
/* build url query -- build urlencoded form data */
this.buildQuery=function(data,key){
  var ret=[],dkey=null;
  for(var d in data){
    dkey=key?key+'['+encodeURIComponent(d)+']'
        :encodeURIComponent(d);
    if(typeof data[d]=='object'&&data[d]!==null){
      ret.push(this.buildQuery(data[d],dkey));
    }else{
      ret.push(dkey+"="+encodeURIComponent(data[d]));
    }
  }return ret.join("&");
};
/* parse query string */
this.parseQuery=function(t){
  if(typeof t!=='string'){return false;}
  var s=t.split('&');
  var r={},c={};
  for(var i=0;i<s.length;i++){
    if(!s[i]||s[i]==''){continue;}
    var p=s[i].split('=');
    var k=decodeURIComponent(p[0]);
    if(k.match(/\[(.*)?\]$/g)){
      var l=k.replace(/\[(.*)?\]$/g,'');
      var w=k.replace(/^.*\[(.*)?\]$/g,"$1");
      c[l]=c[l]?c[l]:0;
      if(w==''){w=c[l];c[l]+=1;}
      if(!r[l]){r[l]={};}
      r[l][w]=decodeURIComponent(p[1]);
      continue;
    }r[k]=p[1]?decodeURIComponent(p[1]):'';
  }return r;
};
/* object length */
this.objectLength=function(obj){
  obj=typeof obj==='object'&&obj!==null?obj:{};
  var size=0,key;
  for(key in obj){
    if(obj.hasOwnProperty(key)){size++;}
  }return size;
};
/* loading view - force-loader-191026 from force-loader-171229 */
this.loader=function(text,info,value,max){
  /* prepare loader id */
  var id='force-loader-191026';
  /* check loader elements */
  var ld=document.getElementById(id);
  var ct=document.getElementById(id+'-text');
  var ci=document.getElementById(id+'-info');
  var cp=document.getElementById(id+'-progress');
  /* check text string */
  if(typeof text!=='string'){
    if(ld){ld.parentNode.removeChild(ld);}
    return false;
  }
  if(!ld){
    /* create elements */
    var ld=document.createElement('div');
    var bg=document.createElement('div');
    var lim=document.createElement('div');
    var img=document.createElement('img');
    var ct=document.createElement('div');
    /* add ids */
    ld.id=id;
    ct.id=id+'-text';
    /* add classes */
    ld.classList.add('force-loader');
    bg.classList.add('force-loader-background');
    lim.classList.add('force-loader-image');
    ct.classList.add('force-loader-text');
    ct.classList.add('blink');
    /* prepare loader image */
    img.width='32px';
    img.height='32px';
    img.alt='Loading...';
    img.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjY2NjIj4KICA8cGF0aCBvcGFjaXR5PSIuMjUiIGQ9Ik0xNiAwIEExNiAxNiAwIDAgMCAxNiAzMiBBMTYgMTYgMCAwIDAgMTYgMCBNMTYgNCBBMTIgMTIgMCAwIDEgMTYgMjggQTEyIDEyIDAgMCAxIDE2IDQiLz4KICA8cGF0aCBkPSJNMTYgMCBBMTYgMTYgMCAwIDEgMzIgMTYgTDI4IDE2IEExMiAxMiAwIDAgMCAxNiA0eiI+CiAgICA8YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIHR5cGU9InJvdGF0ZSIgZnJvbT0iMCAxNiAxNiIgdG89IjM2MCAxNiAxNiIgZHVyPSIwLjhzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz4KICA8L3BhdGg+Cjwvc3ZnPgoK';
    /* appending elements */
    lim.appendChild(img);
    ld.appendChild(bg);
    ld.appendChild(lim);
    ld.appendChild(ct);
  }
  /* add values */
  ct.innerText=text.replace(/\r|\n/g,' ');
  /* default output */
  var out={
    text:ct,
    info:null,
    progress:null,
  };
  /* check info string */
  if(typeof info==='string'){
    if(!ci){
      var ci=document.createElement('div');
      ci.id=id+'-info';
      ci.classList.add('force-loader-info');
      ld.appendChild(ci);
    }ci.innerText=info;
    out.info=ci;
    if(typeof value==='number'
      &&typeof max==='number'){
      if(!cp){
        var cp=document.createElement('progress');
        cp.id=id+'-progress';
        cp.classList.add('force-loader-progress');
        ci.classList.add('force-loader-info-with-progress');
        ld.appendChild(cp);
      }cp.value=value;
      cp.max=max;
      out.info=cp;
    }else if(cp){
      cp.parentNode.removeChild(cp);
    }
  }else if(ci){
    ci.parentNode.removeChild(ci);
  }
  /* append loader element into body */
  document.body.appendChild(ld);
  /* return output elements */
  return out;
};
/* create loader css for loader and splash */
this.loaderCSS=function(){
  var id='force-loader-css',
  c=document.getElementById(id);
  if(c){return c;}
  var s='.force-loader{position:fixed;width:0px;height:0px;top:50%;left:50%;z-index:10000;-webkit-user-select:none;-moz-user-select:none;user-select:none;font-family:arialnarrow,system-ui,monospace;}.force-loader-background{background-color:#fff;opacity:1;position:fixed;width:100%;height:100%;top:0px;left:0px;right:0px;bottom:0px;margin:0px;padding:0px;z-index:10001;}.force-loader-image{margin:-70px 0px 0px 0px;padding:0px;left:0px;width:100%;height:32px;line-height:32px;vertical-align:top;text-align:center;font-family:inherit,system-ui,monospace;color:#777;font-size:13px;z-index:10002;position:fixed;}.force-loader-image img{width:32px;height:32px;}.force-loader-text{margin:-35px 0px 0px 0px;padding:0px;left:0px;width:100%;height:50px;cursor:default;line-height:15px;vertical-align:top;text-align:center;position:fixed;font-family:inherit,system-ui,monospace;color:#777;font-size:13px;z-index:10002;}.force-loader-info{margin:-19px 0px 0px 0px;padding:0px;left:0px;width:100%;height:50px;cursor:default;line-height:15px;vertical-align:top;text-align:center;position:fixed;font-family:inherit,system-ui,monospace;color:#777;font-size:13px;z-index:10002;}.force-loader-info-with-progress{margin:-4px 0px 0px 0px;}.force-loader-progress{margin:-13px 0px 0px 0px;padding:0px;height:5px;border:0px none;border-radius:2px;width:calc(100% - 30px);background-color:#ddd;transition:all 0.1s ease 0s;cursor:default;position:fixed;z-index:10002;left:15px;}.force-loader-progress::-moz-progress-bar{background:#9d5;border-radius:2px;}.force-loader-progress::-webkit-progress-value{background:#9d5;border-radius:2px;}.force-loader-progress::-webkit-progress-bar{background:#ddd;border-radius:2px;}.force-splash{display:block;position:fixed;z-index:9999;top:7%;left:calc(15% - 20px);background-color:#000;color:#fff;opacity:0.5;padding:10px 20px;width:70%;max-width:70%;max-height:70%;text-align:center;border:0px none;border-radius:7px;transition:all 0.3s ease 0s;white-space:pre-wrap;overflow-x:hidden;overflow-y:auto;word-break:break-word;-moz-user-select:none;-webkit-user-select:none;user-select:none;font-size:13px;font-family:arialnarrow,system-ui,monospace;}';
  c=document.createElement('style');
  c.rel='stylesheet';
  c.type='text/css';
  c.media='screen';
  c.textContent=this.fontCSS()+s;
  c.id=id;
  document.head.appendChild(c);
  return c;
};
/* create dialog css for dialog */
this.dialogCSS=function(){
  var id='force-dialog-css',
  c=document.getElementById(id);
  if(c){return c;}
  var s='.force-dialog{transition:all 0.3s ease 0s;width:270px;height:auto;max-height:270px;margin:0px;padding:0px;background-color:#fff;display:block;position:fixed;z-index:99999;top:-100vh;left:calc(50vw - 135px);box-shadow:0px 0px 15px #999;border:0px none;border-radius:10px;overflow:hidden;font-family:arialnarrow,system-ui,monospace;}.force-dialog-show{top:calc(50vh - 135px);}.force-dialog-background{transition:all 0.5s ease 0s;width:100vw;height:100vh;margin:0px;padding:0px;background-color:#fff;opacity:0.5;display:block;position:fixed;z-index:99998;top:0px;left:0px;right:0px;bottom:0px;border:0px none;overflow:hidden;}.force-dialog-title{font-weight:bold;font-size:20px;color:#555;border-bottom:1px solid #ddd;box-shadow:0px 1px 5px #ddd;margin:0px;padding:0px;text-align:center;height:50px;line-height:50px;overflow:hidden;white-space:pre-wrap;font-family:inherit,system-ui,monospace;}.force-dialog-title:before{content:attr(data-text);}.force-dialog-text-out{margin:0px;padding:20px 10px;overflow:hidden;}.force-dialog-text{font-size:16px;color:#555;margin:0px;padding:0px;overflow-x:hidden;overflow-y:auto;white-space:pre-wrap;word-wrap:pre-wrap;word-break:break-all;height:auto;max-height:113px;text-align:center;font-family:inherit,system-ui,monospace;}.force-dialog-text:before{content:attr(data-text);}.force-dialog-text-left{text-align:left;}.force-dialog-input{width:calc(100% - 20px);font-size:16px;border:1px solid #ddd;border-radius:5px;margin:10px 10px 10px;padding:7px 13px;color:#333;font-weight:normal;background-color:#eed;font-family:inherit,system-ui,monospace;}.force-dialog-button-out{border-top:1px solid #ddd;box-shadow:0px -1px 5px #ddd;margin:0px;padding:0px;text-align:center;height:65px;line-height:60px;overflow:hidden;}.force-dialog-button:focus{background-color:#ccb;outline:none;}.force-dialog-button:hover{background-color:#ddc;}.force-dialog-button:disabled{background-color:#ddc;color:#333;opacity:0.8;}.force-dialog-button:before{content:attr(data-text);}.force-dialog-button{background-color:#eed;padding:7px 13px;border:0px none;color:#333;font-size:16px;line-height:16px;margin:0px 0px;border-radius:3px;cursor:default;transition:all 0.3s ease 0s;box-shadow:1px 1px 3px #777;outline:none;font-weight:bold;font-family:inherit,system-ui,monospace;display:inline-block;cursor:default;}.force-dialog-button-left{margin-right:10px;}.force-dialog-button-blue:focus{background-color:#159;}.force-dialog-button-blue:hover{background-color:#26a;}.force-dialog-button-blue{color:#fff;background-color:#37b;}.force-dialog-button-soft-green:focus{background-color:#591;}.force-dialog-button-soft-green:hover{background-color:#6a2;}.force-dialog-button-soft-green{color:#fff;background-color:#7b3;}.force-dialog-button-orange:focus{background-color:#951;}.force-dialog-button-orange:hover{background-color:#a62;}.force-dialog-button-orange{color:#fff;background-color:#b73;}.force-dialog-button-red:focus{background-color:#a11;}.force-dialog-button-red:hover{background-color:#b22;}.force-dialog-button-red{color:#fff;background-color:#c33;}.force-dialog-button-yellow:focus{background-color:#aa1;}.force-dialog-button-yellow:hover{background-color:#bb2;}.force-dialog-button-yellow{color:#fff;background-color:#cc3;}.force-dialog-button-purple:focus{background-color:#519;}.force-dialog-button-purple:hover{background-color:#62a;}.force-dialog-button-purple{color:#fff;background-color:#73b;}.force-dialog-button-pink:focus{background-color:#915;}.force-dialog-button-pink:hover{background-color:#a26;}.force-dialog-button-pink{color:#fff;background-color:#b37;}.force-dialog-button-tosca:focus{background-color:#195;}.force-dialog-button-tosca:hover{background-color:#2a6;}.force-dialog-button-tosca{color:#fff;background-color:#3b7;}.force-dialog-button-violet:focus{background-color:#a1a;}.force-dialog-button-violet:hover{background-color:#b2b;}.force-dialog-button-violet{color:#fff;background-color:#c3c;}.force-dialog-button-light-blue:focus{background-color:#1aa;}.force-dialog-button-light-blue:hover{background-color:#2bb;}.force-dialog-button-light-blue{color:#fff;background-color:#3cc;}.force-dialog-button-dark-blue:focus{background-color:#11a;}.force-dialog-button-dark-blue:hover{background-color:#22b;}.force-dialog-button-dark-blue{color:#fff;background-color:#33c;}.force-dialog-button-green:focus{background-color:#1a1;}.force-dialog-button-green:hover{background-color:#2b2;}.force-dialog-button-green{color:#fff;background-color:#3c3;}';
  c=document.createElement('style');
  c.rel='stylesheet';
  c.type='text/css';
  c.media='screen';
  c.textContent=this.fontCSS()+s;
  c.id=id;
  document.head.appendChild(c);
  return c;
};
/* font css string */
this.fontCSS=function(){
  return '@font-face{font-family:"arialnarrow";src:url("data:font/ttf;base64,AAEAAAARAQAABABgTFRTSDkC4a0AAAEcAAAA5E9TLzKN1pLJAAACAAAAAE5WRE1Y+U7HyQAAAlAAABdwY21hcIfvz5oAAOfcAAACkGN2dCBoEjyiAAAZwAAABFxmcGdtj6fpiQAAHhwAAAQjZ2x5ZleAPTMAACJAAACX4GhkbXiqZW5ZAAC6IAAAFWhoZWFkr5LdzAAAz4gAAAA2aGhlYQyZBF0AAM/AAAAAJGhtdHgRlT1+AADP5AAAA3xrZXJuB/0HRAAA02AAAAKIbG9jYTB/WUQAANXoAAABwG1heHAEpgJhAADXqAAAACBuYW1lqu8SZgAA18gAAAUjcG9zdIJw1egAANzsAAAB8HByZXB6gZ9+AADe3AAACQAAAADfAQEBAREB2AH4AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBGgENDAEBAQ0eARgBGQ0BAQoBGhoNGx0THREBAQEBAQEdERAeERknAR0dHR4dARERHgEBFAEeGRYeEAEBAQEaGg0BDQENHR0dHR0dEBEREREZGRkZARERERERAQEBAQEBAQEBAcEBAQEBAQEBAQEBAQEBHR0BEQEBAQEBARoaAQEZAQH//wEBAR4dAQEBAQEBAf/8GgEaAQEeHh4eAQEBDQ0NGQEBAQEBGgEBDBEdHgERAQEBAQEBAQEBAQAAAALlAZAAAwAABZoFMwAAAJMFmgUzAAACCwBmAhIIBQILBQYCAgIDAgQAAAAAAAD////AAAAAAAAATW9ubwBAACAiGQXT/lEBDQdgAa8AAAAAAAQABAEBAQEBBAMDAQUDAwECAQEAHgXyC8YRmgD4CP8ACAAK//0ACQAK//0ACgAL//0ACwAM//0ADAAN//0ADQAN//0ADgAO//0ADwAQ//wAEAAQ//wAEQAR//sAEgAS//wAEwAT//wAFAAT//sAFQAU//sAFgAV//sAFwAV//oAGAAX//oAGQAY//oAGgAZ//oAGwAZ//oAHAAa//kAHQAb//oAHgAb//gAHwAd//kAIAAe//kAIQAg//gAIgAg//gAIwAh//cAJAAi//gAJQAi//cAJgAj//cAJwAk//cAKAAl//cAKQAn//YAKgAo//cAKwAq//YALAAr//cALQAr//YALgAs//UALwAt//YAMAAt//QAMQAu//UAMgAv//UAMwAw//UANAAy//QANQAz//QANgA0//QANwA0//MAOAA1//MAOQA2//MAOgA3//QAOwA3//IAPAA4//MAPQA6//IAPgA6//IAPwA7//IAQAA8//EAQQA9//IAQgA9//EAQwA+//EARAA///EARQBB//AARgBC//AARwBE//AASABD//AASQBG/+8ASgBH/+8ASwBI//AATABI/+8ATQBJ/+4ATgBK/+8ATwBI/+8AUABM/+4AUQBN/+4AUgBO/+0AUwBO/+0AVABP/+0AVQBQ/+0AVgBR/+0AVwBR/+wAWABS/+wAWQBT/+wAWgBU/+sAWwBV/+wAXABX/+wAXQBV/+wAXgBY/+sAXwBW/+oAYABZ/+sAYQBc/+oAYgBd/+oAYwBf/+oAZABd/+kAZQBg/+kAZgBe/+kAZwBi/+kAaABi/+gAaQBj/+gAagBk/+gAawBi/+kAbABm/+cAbQBn/+gAbgBo/+gAbwBo/+cAcABp/+cAcQBo/+YAcgBp/+cAcwBs/+YAdABq/+YAdQBr/+YAdgBs/+QAdwBw/+UAeABu/+UAeQBv/+UAegBy/+QAewBy/+UAfABz/+QAfQB2/+QAfgB3/+MAfwB2/+QAgAB3/+QAgQB6/+MAggB7/+MAgwB8/+IAhAB8/+IAhQB7/+IAhgB7/+IAhwB8/+IAiAB9/+EAiQB//+EAigCA/+EAiwCA/+EAjACB/+EAjQCC/+EAjgCD/+AAjwCD/+AAkACE/98AkQCE/+AAkgCG/+AAkwCK/98AlACI/98AlQCJ/98AlgCL/94AlwCM/+AAmACN/+AAmQCO/98AmgCP/98AmwCQ/98AnACR/98AnQCR/94AngCT/98AnwCT/94AoACU/90AoQCU/94AogCV/94AowCX/94ApACX/90ApQCZ/90ApgCZ/90ApwCa/90AqACa/9wAqQCc/9wAqgCd/9wAqwCd/9wArACe/9wArQCe/9sArgCh/9sArwCh/9oAsACi/9sAsQCi/9sAsgCl/9oAswCm/9oAtACn/9oAtQCo/9oAtgCo/9oAtwCp/9kAuACq/9kAuQCs/9kAugCt/9gAuwCt/9gAvACu/9gAvQCu/9gAvgCv/9gAvwCw/9cAwACx/9gAwQCy/9cAwgCz/9cAwwC0/9cAxAC1/9YAxQC2/9YAxgC2/9YAxwC3/9YAyAC3/9YAyQC4/9UAygC7/9UAywC7/9UAzAC8/9UAzQC+/9UAzgC//9UAzwDA/9QA0ADB/9QA0QDB/9MA0gDC/9QA0wDD/9QA1ADE/9MA1QDG/9MA1gDG/9IA1wDH/9MA2ADH/9IA2QDI/9IA2gDJ/9IA2wDK/9EA3ADL/9EA3QDM/9EA3gDN/9EA3wDN/9EA4ADP/9EA4QDP/9EA4gDQ/9AA4wDR/88A5ADR/9AA5QDS/88A5gDT/88A5wDV/88A6ADX/84A6QDY/88A6gDZ/84A6wDa/84A7ADb/84A7QDb/84A7gDc/80A7wDc/80A8ADe/80A8QDf/80A8gDg/80A8wDh/8wA9ADh/8wA9QDi/8sA9gDj/8wA9wDk/8wA+ADk/8sA+QDm/8sA+gDn/8sA+wDn/8sA/ADp/8oA/QDp/8oA/gDq/8sA/wDq/8oA+Aj/AAgACv/9AAkACv/9AAoAC//9AAsADP/9AAwADf/9AA0ADf/9AA4ADv/9AA8AEP/8ABAAEP/8ABEAEf/7ABIAEv/8ABMAE//8ABQAE//7ABUAFP/7ABYAFf/7ABcAFf/6ABgAF//6ABkAGP/6ABoAGf/6ABsAGf/6ABwAGv/5AB0AG//6AB4AG//4AB8AHf/5ACAAHv/5ACEAIP/4ACIAIP/4ACMAIf/3ACQAIv/4ACUAIv/3ACYAI//3ACcAJP/3ACgAJf/3ACkAJ//2ACoAKP/2ACsAKv/2ACwAK//2AC0AK//2AC4ALP/1AC8ALf/2ADAALf/0ADEALv/1ADIAL//1ADMAMf/0ADQAMv/0ADUAM//0ADYANP/0ADcANP/zADgANf/zADkANv/zADoAN//0ADsAN//yADwAOP/zAD0AOv/yAD4AOv/yAD8AO//yAEAAPP/xAEEAPf/yAEIAPf/xAEMAPv/xAEQAP//xAEUAQf/wAEYAQv/wAEcARP/wAEgAQ//wAEkARv/vAEoAR//vAEsASP/vAEwASP/vAE0ASf/uAE4ASv/vAE8ASP/vAFAATP/uAFEATf/uAFIATv/tAFMATv/tAFQAT//tAFUAUP/tAFYAUf/tAFcAUf/sAFgAUv/sAFkAU//sAFoAVP/rAFsAVf/sAFwAVv/rAF0AVf/sAF4AWP/rAF8AVv/qAGAAWf/rAGEAXP/qAGIAXf/qAGMAX//qAGQAXf/pAGUAYP/pAGYAXv/pAGcAYv/pAGgAYv/oAGkAY//oAGoAZP/oAGsAYv/pAGwAZv/nAG0AZ//oAG4AaP/oAG8AaP/nAHAAaf/nAHEAaP/mAHIAaf/nAHMAav/oAHQAav/nAHUAa//mAHYAbP/mAHcAbv/mAHgAbv/mAHkAb//lAHoAcP/mAHsAcv/mAHwAc//kAH0AdP/lAH4Adf/lAH8Adv/lAIAAd//kAIEAeP/lAIIAef/lAIMAev/jAIQAev/jAIUAe//jAIYAe//jAIcAfP/iAIgAff/jAIkAf//jAIoAgP/iAIsAgP/hAIwAgf/iAI0Agv/iAI4Ag//hAI8Ag//iAJAAhP/hAJEAhP/hAJIAhv/gAJMAiP/hAJQAiP/hAJUAif/gAJYAi//gAJcAjP/gAJgAjf/gAJkAjv/fAJoAj//fAJsAkP/fAJwAkf/fAJ0Akf/eAJ4Ak//fAJ8Ak//eAKAAlP/dAKEAlP/eAKIAlf/dAKMAl//eAKQAl//dAKUAmf/dAKYAmf/dAKcAmv/dAKgAmv/cAKkAnP/cAKoAnf/cAKsAnf/cAKwAnv/cAK0Anv/bAK4Aof/bAK8Aof/aALAAov/bALEAov/bALIApf/aALMApv/aALQAp//aALUAqP/aALYAqP/aALcAqf/ZALgAqv/ZALkArP/ZALoArf/YALsArf/YALwArv/YAL0Arv/YAL4Ar//YAL8AsP/XAMAAsf/YAMEAsv/XAMIAs//XAMMAtP/XAMQAtf/WAMUAtv/WAMYAtv/WAMcAt//WAMgAt//WAMkAuP/VAMoAu//VAMsAu//VAMwAvP/VAM0Avv/VAM4Av//VAM8AwP/UANAAwf/UANEAwf/TANIAwv/UANMAw//UANQAxP/TANUAxv/TANYAxv/SANcAx//TANgAx//SANkAyP/SANoAyf/SANsAyv/RANwAy//RAN0AzP/RAN4Azf/RAN8Azf/RAOAAz//RAOEAz//RAOIA0P/QAOMA0f/PAOQA0f/QAOUA0v/PAOYA0//PAOcA1f/PAOgA1//PAOkA2P/PAOoA2f/OAOsA2v/OAOwA2//OAO0A2//OAO4A3P/NAO8A3P/NAPAA3v/NAPEA3//NAPIA4P/NAPMA4f/MAPQA4f/MAPUA4v/LAPYA4//MAPcA5P/MAPgA5P/LAPkA5v/LAPoA5//LAPsA5//LAPwA6f/KAP0A6f/KAP4A6v/LAP8A6v/KAPgI/wAIAAr//QAJAAr//QAKAAv//QALAAz//QAMAA3//QANAA3//QAOAA///QAPABD//AAQABD//AARABH/+wASABL//AATABP//AAUABP/+wAVABT/+wAWABX/+wAXABX/+gAYABf/+gAZABj/+gAaABn/+gAbABn/+gAcABr/+QAdABv/+gAeABv/+AAfAB3/+QAgAB7/+QAhACD/+AAiACD/+AAjACH/9wAkACL/+AAlACL/9wAmACP/9wAnACT/9wAoACX/9wApACf/9gAqACj/9gArACr/9gAsACv/9gAtACv/9gAuACz/9QAvAC3/9gAwAC3/9AAxAC7/9QAyAC//9QAzADH/9AA0ADL/9AA1ADP/9AA2ADT/9AA3ADT/8wA4ADX/8wA5ADb/8wA6ADf/9AA7ADf/8gA8ADj/8wA9ADr/8gA+ADr/8gA/ADv/8gBAADz/8QBBAD3/8gBCAD3/8QBDAD7/8QBEAD//8QBFAEH/8ABGAEL/8ABHAET/8ABIAEP/8ABJAEb/7wBKAEf/7wBLAEj/8ABMAEj/7wBNAEn/7gBOAEr/7wBPAEj/7wBQAEz/7gBRAE3/7gBSAE7/7QBTAE7/7QBUAE//7QBVAFD/7QBWAFH/7QBXAFH/7ABYAFL/7ABZAFP/7ABaAFT/6wBbAFP/7ABcAFb/7ABdAFX/7ABeAFb/7ABfAFb/6gBgAFn/6wBhAFz/6wBiAFv/6wBjAF3/6gBkAF3/6QBlAF7/6wBmAF7/6QBnAGD/6QBoAGD/6QBpAGH/6QBqAGL/6ABrAGL/6QBsAGb/6QBtAGX/6QBuAGb/6ABvAGb/6ABwAGf/6ABxAGj/5gByAGn/5wBzAGr/6AB0AGr/5wB1AGv/5gB2AGz/5gB3AG7/5gB4AG7/5gB5AG//5QB6AHD/5gB7AHL/5gB8AHP/5AB9AHT/5QB+AHX/5QB/AHb/5QCAAHf/5ACBAHj/5QCCAHn/5QCDAHr/4wCEAHr/4wCFAHv/4wCGAHv/4wCHAHz/4gCIAH3/4wCJAH//4wCKAID/4gCLAID/4QCMAIH/4gCNAIL/4gCOAIP/4QCPAIP/4gCQAIT/4QCRAIT/4QCSAIb/4ACTAIj/4QCUAIj/4QCVAIn/4ACWAIv/4ACXAIz/4ACYAI3/4ACZAI7/3wCaAI//3wCbAJD/3wCcAJH/3wCdAJH/3gCeAJP/3wCfAJP/3gCgAJT/3QChAJT/3gCiAJX/3QCjAJf/3gCkAJf/3QClAJn/3QCmAJn/3QCnAJr/3QCoAJr/3ACpAJz/3ACqAJ3/3ACrAJ3/3ACsAJ7/3ACtAJ7/2wCuAKH/2wCvAKH/2gCwAKL/2wCxAKL/2wCyAKX/2gCzAKb/2gC0AKf/2gC1AKj/2gC2AKj/2gC3AKn/2QC4AKr/2QC5AKz/2QC6AK3/2AC7AK3/2AC8AK7/2AC9AK7/2AC+AK//2AC/ALD/1wDAALH/2ADBALL/1wDCALP/1wDDALT/1wDEALX/1gDFALb/1gDGALb/1gDHALf/1gDIALf/1gDJALj/1QDKALv/1QDLALv/1QDMALz/1QDNAL7/1QDOAL//1QDPAMD/1ADQAMH/1ADRAMH/0wDSAML/1ADTAMP/1ADUAMT/0wDVAMb/0wDWAMb/0gDXAMf/0wDYAMf/0gDZAMj/0gDaAMn/0gDbAMr/0QDcAMv/0QDdAMz/0QDeAM3/0QDfAM3/0QDgAM//0QDhAM//0QDiAND/0ADjANH/zwDkANH/0ADlANL/zwDmANP/zwDnANX/zwDoANf/zgDpANj/zwDqANn/zgDrANr/zgDsANv/zgDtANv/zgDuANz/zQDvANz/zQDwAN7/zQDxAN//zQDyAOD/zQDzAOH/zAD0AOH/zAD1AOL/ywD2AOP/zAD3AOT/zAD4AOT/ywD5AOb/ywD6AOf/ywD7AOf/ywD8AOn/ygD9AOn/ygD+AOr/ywD/AOr/ygD4CP8ACAAK//0ACQAK//0ACgAL//0ACwAM//0ADAAN//0ADQAN//0ADgAP//0ADwAQ//wAEAAQ//wAEQAR//sAEgAS//wAEwAT//wAFAAT//sAFQAU//sAFgAV//sAFwAV//oAGAAX//oAGQAY//oAGgAZ//oAGwAZ//oAHAAa//kAHQAb//oAHgAb//gAHwAd//kAIAAe//kAIQAg//gAIgAg//gAIwAh//cAJAAi//gAJQAi//cAJgAj//cAJwAk//cAKAAl//cAKQAn//YAKgAo//YAKwAq//YALAAr//cALQAr//YALgAs//UALwAt//YAMAAt//QAMQAu//UAMgAv//UAMwAx//QANAAy//QANQAz//QANgA0//QANwA0//MAOAA1//MAOQA2//MAOgA3//QAOwA3//IAPAA4//MAPQA6//IAPgA6//IAPwA7//IAQAA8//EAQQA9//IAQgA9//EAQwA+//EARABB//EARQBB/+8ARgBC//AARwBE//AASABD//AASQBG/+8ASgBH/+8ASwBI//AATABI/+8ATQBH/+4ATgBI/+8ATwBI/+8AUABM/+4AUQBN/+4AUgBM/+0AUwBO/+4AVABN/+0AVQBO/+0AVgBP/+0AVwBR/+0AWABQ/+wAWQBR/+wAWgBU/+wAWwBT/+wAXABV/+sAXQBV/+wAXgBW/+wAXwBW/+oAYABZ/+sAYQBc/+sAYgBb/+sAYwBd/+oAZABd/+kAZQBe/+sAZgBe/+kAZwBg/+kAaABg/+kAaQBh/+kAagBi/+gAawBi/+kAbABm/+kAbQBl/+kAbgBm/+gAbwBm/+gAcABn/+gAcQBo/+YAcgBp/+cAcwBq/+gAdABq/+cAdQBr/+YAdgBs/+YAdwBu/+YAeABu/+YAeQBv/+UAegBw/+YAewBy/+YAfABz/+QAfQB0/+UAfgB1/+UAfwB2/+UAgAB3/+QAgQB4/+UAggB5/+UAgwB6/+MAhAB6/+MAhQB7/+MAhgB7/+MAhwB8/+IAiAB9/+MAiQB//+MAigCA/+IAiwCA/+EAjACB/+IAjQCC/+IAjgCD/+EAjwCD/+IAkACE/+EAkQCE/+EAkgCG/+AAkwCI/+EAlACI/+EAlQCJ/+AAlgCL/+AAlwCM/+AAmACN/+AAmQCO/98AmgCP/98AmwCQ/98AnACR/98AnQCR/94AngCT/98AnwCT/94AoACU/90AoQCU/94AogCV/90AowCX/94ApACX/90ApQCZ/90ApgCZ/90ApwCa/90AqACa/9wAqQCc/9wAqgCd/9wAqwCd/9wArACe/9wArQCe/9sArgCh/9sArwCh/9oAsACi/9sAsQCi/9sAsgCl/9oAswCm/9oAtACn/9oAtQCo/9oAtgCo/9oAtwCp/9kAuACq/9kAuQCs/9kAugCt/9gAuwCt/9gAvACu/9gAvQCu/9gAvgCv/9gAvwCw/9cAwACx/9gAwQCy/9cAwgCz/9cAwwC0/9cAxAC1/9YAxQC2/9YAxgC2/9YAxwC3/9YAyAC3/9YAyQC4/9UAygC7/9UAywC7/9UAzAC8/9UAzQC+/9UAzgC//9UAzwDA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BwYCBQYFCAcHBgcHBgYHBggGBgYDAwMEBQMFBQUFBQIFBQICBQIIBQUFBQMFAgUGCAYGBQMCAwUGBgcGBwcHBQUFBQUFBQUFBQUCAgICBQUFBQUFBQUFBQUEBQUFAwYGBwcJAwMJBwYFBgMDCAUGAwUFBQUJAwYGBwkIBQkEBAICBgYGAgUDAwUDAgQKBgYGBgYCAgICBwcHBwcHAgMDAwMDBgUCBgUGBgYFBQMDAwgICAYDAwAAAAwLAwADAwMEBgULBwIDAwQGAwMDAwUFBQUFBQUFBQUDAwYGBgUKBwcIBwcGCAgDBQcFCQgIBwgHBwUIBwkGBwUDAwMFBQMFBQUFBQIFBQICBQIIBQUFBQMFAgUGCAYGBQMDAwYHBwgHCAgIBQUFBQUFBQUFBQUCAgICBQUFBQUFBQUFBQUFBQUFAwYGBwcKAwMKCAcFBwQECAUGAwYFBQUKAwcHCAoIBQoEBAICBwYHAgUDAwUDAgQLBwcHBwcDAwMDCAgICAgIAgMDAwMDBwUDBwUHBgcFBgMDAwgICAYDAwAAAA0LAwADAwMEBwYLBwIEBAQGAwQDAwYGBgYGBgYGBgYDAwYGBgYLBwcICAcHCAgDBQcGCQgIBwgIBwcIBwkHBwcDAwMFBgQGBgUGBgIGBgICBQIIBgYGBgQFAgYGCAYGBQQDBAYHBwgHCAgIBgYGBgYGBQYGBgYCAgICBgYGBgYGBgYGBgYFBgYGBAYHCAgLBAQLCAcGBwQECgYHBAYGBgYLAwcHCAsKBgsEBAICBwYHAgYEBAYDAgQLBwcHBwcDAwMDCAgICAgIAgQEBAQEBwUDCAYHBgcGBgQEBAkJCQcEBAAAAA8OAwADAwMEBwcLCAIEBAUHAwQDAwcHBwcHBwcHBwcDAwcHBwcMBwgJCQgICgkDBggHCwkKCAoJCAkJBwsIBwgDAwMGBwQHBwcHBwMHBwMDBgMLBwcHBwQGAwcFCQYFBQQDBAcHBwkICQoJBwcHBwcHBwcHBwcDAwMDBwcHBwcHBwcHBwcGBwcHBAYICQkMBAQMCggHCQUECwcIBAcHBwcMAwcHCgwMBwwEBAMDCAUHAgcEBAcDAwQOBwgHCAgDAwMDCgoKCQkJAwQEBAQECAYDCQcHBQgHBwQEBAoKCggEBAAAABAOBAAEBAMFCAcMCQMEBAUIBAQEBAcHBwcHBwcHBwcEBAgICAcNCQkJCQkICgkDBwkHCwkKCQoJCQcJCQwICQcEBAQGBwQHCAcICAMIBwMDBwMLBwgICAQHAwcHCQcHBwQDBAgJCQkJCQoJBwcHBwcHBwgICAgDAwMDBwgICAgIBwcHBwcGBwcHBQcICgoNBAQNCgkHCQUFDQcIAwgHBwcNBAkJCg0MBw0EBAMDCQcJAgcEBAcEAwQOCQkJCQkDAwMDCgoKCQkJAwQEBAQECQcDCQgJBwkICAQEBAsLCwgEBAAAABEOBAAEBAQFCAgMCQMFBQUIBAUEBAgICAgICAgICAgEBAgICAgOCQkKCgkJCwoDBwkIDQoLCQsKCQkKCQ0JCQkEBAQHCAUICAcICAMICAMDBwMNCAgICAUHAwgHCQcHBwUEBQgJCQoJCgsKCAgICAgIBwgICAgDAwMDCAgICAgICAgICAgHCAgIBQgJCgoOBQUOCwkICgUFDQgJBQgICAgOBAkJCw4NCA4EBAMDCQcJAggFBQgEAwQOCQkJCQkDAwMDCwsLCgoKAwUFBQUFCQcECggJBwkICAUFBQwMDAkFBQAAABMQBAAEBAQGCAkMCgMFBQYJBAUEBAkJCQkJCQkJCQkEBAkJCQkQCgoLCwoKDAsDCAoJDQsMCgwLCgkLCw8KCQoEBAQHCQUJCQgJCQMJCQMDCAMNCQkJCQUIAwkHCwgHCAUEBQkKCgsKCwwLCQkJCQkJCAkJCQkDAwMDCQkJCQkJCQkJCQkICQkJBQgKCwsQBQUQDAoJCwYGDwkKBQkJCQkQBAoKDBAPCRAEBAMDCgcJAwkFBQkEAwQOCgoKCgoDAwMDDAwMCwsLAwUFBQUFCggECwkJBwoJCQUFBQ0NDQoFBQAAABUVBQAFBQUGCwoTCwMGBgcKBQYFBQoKCgoKCgoKCgoFBQoKCgoRCwsMDAsLDQwECQsKDwwNCw0MCwsMCxALDAsFBQUICgYKCgkKCgUKCgQECQQOCgoKCgYJBQoJDQgJCQYEBgoLCwwLDA0MCgoKCgoKCQoKCgoEBAQECgoKCgoKCgoKCgoICgoKBgoLDQ0RBgYRDQwKDAYGDwoLBgoKCgoRBQsLDREQChEHBwQEDAkMAwoGBgoFBAcVCwsLCwsEBAQEDQ0NDAwMBAYGBgYGCwkEDAoMCQsKCgYGBg4ODgsGBgAAABgYBQAFBQUHDAsTDQQHBwgMBQcFBQsLCwsLCwsLCwsFBQwMDAsUDQ0ODg0MDw4ECg0LEQ4PDQ8ODQwODRMNDQwFBQUJCwcLCwoLCwYLCwQECgQQCwsLCwcKBQsJDwoJCgcFBwwNDQ4NDg8OCwsLCwsLCgsLCwsEBAQECwsLCwsLCwsLCwsKCwsLBwwMDw8UBwcUDw0LDgcHEg0MBwwLCwsUBQ0NDxQSCxQHBwQEDQkNAwsHBwsFBAcYDQ0NDQ0EBAQEDw8PDg4OBAcHBwcHDQoFDgsNCQ0LDAcHBxAQEAwHBwAAABsZBgAGBgYIDAwUDwQHBwkNBgcGBgwMDAwMDAwMDAwGBg0NDQwWDw8QEA8OERAGCw8MEhARDxEQDw4QDxUPDw4GBgYKDAcMDAsMDAYMDAUFCwUSDAwMDAcLBgwLEAsLCwcGBw0PDxAPEBEQDAwMDAwMCwwMDAwGBgYGDAwMDAwMDAwMDAwLDAwMCAwOEBAWBwcWEQ8MEAgIFA4OBw0MDAwWBg8PERYVDBYHBwUFDwsPBAwHBwwGBQcZDw8PDw8GBgYGEREREBAQBgcHBwcHDwsGEAwPCw8MDQcHBxISEg4HBwAAAB0ZBwAHBwcIDg0XEAUICAkOBwgHBw0NDQ0NDQ0NDQ0HBw4ODg0YEBARERAPExEGDBANFBETEBMREA8REBYQEA8HBwcLDQgNDQwODQcODQUFDAQUDQ0NDggMBw0LEQwLDAgGCA4QEBEQERMRDQ0NDQ0NDA0NDQ0HBwcHDQ0NDQ0NDQ0NDQ0MDQ0NCA4PEhIYCAgYExANEQkJFQ8PCA4NDQ0YBxAQExgWDRgHBwUFEAsQBA0ICA0HBQcZEBAQEBAGBgYGExMTERERBwgICAgIEAwGEQ0QCxANDggICBQUFA8ICAAAACAcBwAHBwcJDg8XEgUJCQoPBwkHBw8PDw8PDw8PDw8HBw8PDw8bEhITExIQFBMHDRIPFhMUEhQTEhATEhkSEhAHBwcMDwkPDw0PDwcPDwYGDQYWDw8PDwkNBw8NEw0NDQkHCQ8SEhMSExQTDw8PDw8PDQ8PDw8HBwcHDw8PDw8PDw8PDw8NDw8PCQ4QExMaCQkaFBIPEgoKFxAQCQ8PDw8aBxISFBoZDxoHBwYGEg0SBA8JCQ8HBgccEhISEhIHBwcHFBQUExMTBwkJCQkJEg0HEw8SDRIPDwkJCRYWFhAJCQAAACEcCAAICAgK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cmVnaXN0ZXJlZCB0cmFkZW1hcmsgb2YgVGhlIE1vbm90eXBlIENvcnBvcmF0aW9uIHBsYy4AbgBvAHIAbQBhAGwAUwB0AGEAbgBkAGEAcgBkAFQAeQBwAGUAZgBhAGMAZQAgAKkAIABUAGgAZQAgAE0AbwBuAG8AdAB5AHAAZQAgAEMAbwByAHAAbwByAGEAdABpAG8AbgAgAHAAbABjAC4AIABEAGEAdABhACAAqQAgAFQAaABlACAATQBvAG4AbwB0AHkAcABlACAAQwBvAHIAcABvAHIAYQB0AGkAbwBuACAAcABsAGMALwBUAHkAcABlACAAUwBvAGwAdQB0AGkAbwBuAHMAIABJAG4AYwAuADEAOQA5ADAALQAxADkAOQAxACAAQQBsAGwAIABSAGkAZwBoAHQAcwAgAFIAZQBzAGUAcgB2AGUAZAAuAEEAcgBpAGEAbAAgAE4AYQByAHIAbwB3AFIAZQBnAHUAbABhAHIAQQByAGkAYQBsACAATgBhAHIAcgBvAHcAIABSAGUAZwB1AGwAYQByACAAOgAgADEAOQA5ADEAQQByAGkAYQBsACAATgBhAHIAcgBvAHcAVgBlAHIAcwBpAG8AbgAgADEALgAwADEAQQByAGkAYQBsAE4AYQByAHIAbwB3AEEAcgBpAGEAbAAgAGkAcwAgAGEAIAByAGUAZwBpAHMAdABlAHIAZQBkACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABUAGgAZQAgAE0AbwBuAG8AdAB5AHAAZQAgAEMAbwByAHAAbwByAGEAdABpAG8AbgAgAHAAbABjAC4ATgBvAHIAbQBhAGwATgBvAHIAbQBhAGEAbABpAE4AbwByAG0AYQBsAE4AbwByAG0AYQBsAGUAUwB0AGEAbgBkAGEAYQByAGQATgBvAHIAbQBhAGwATgBvAHIAbQBhAGwATgBvAHIAbQBhAGwATgBvAHIAbQBhAGwATgBvAHIAbQBhAGwAAAIAAAAAAAD/JwCWAAAAAAAAAAAAAAAAAAAAAAAAAAAA3wAAAAAAAAADAAQABQAGAAcACAAJAAoACwAMAA0ADgAPABAAEQASABMAFAAVABYAFwAYABkAGgAbABwAHQAeAB8AIAAhACIAIwAkACUAJgAnACgAKQAqACsALAAtAC4ALwAwADEAMgAzADQANQA2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");}';
};
/* prevent context menu */
this.absorbEvent=function(event){
  var e=event||window.event;
  e.preventDefault&&e.preventDefault();
  e.stopPropagation&&e.stopPropagation();
  e.cancelBubble=true;
  e.returnValue=false;
  return false;
};
/* temporary */
this.temp=function(cb){
  cb=typeof cb==='function'?cb:function(){};
  return cb(false);
};
};
