/* Polyfill */
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}


function Functions(){}

Functions.prototype = (function(){
  return {
    findElement: function(rootEl, tagName){
      var imageEl = rootEl.tagName.toLowerCase() === tagName ? rootEl : null;

      imageEl = rootEl.querySelector(tagName);
      if( imageEl ) return imageEl;

      imageEl = rootEl.parentElement.querySelector(tagName);
      if( imageEl ) return imageEl;

      imageEl = rootEl.closest(tagName);
      if( imageEl ) return imageEl;

      return null;
    }
  }
})();


function CustomContextMenu( _config, elements ){
  var self = this;

  var instance = null;
  var config = {
    root: document.body,
    debug: false,
    point_gap: 0,
  }
  
  var datas ={}
  
  var events = {
    binds: [],
    handler: null,
    current: null,
  }
  
  var open = false;
  var props = ( props||{} );
  
  if( _config ){
  	config = Objects.assign({}, config, _config);
  }
  
  if( elements ){
    if( Array.isArray( elements ) ){
      events.binds = elements;
    } else {
      events.binds.push( elements ); 
    }
  }
    
  self.getInstance = function(){ return instance; }
  self.setInstance = function(i){ instance = i; }
  self.clearInstance = function(i){ instance = null; }
  
  self.getConfig = function(k){ return config[k]; }
  self.setConfig = function(k,v){ config[k] = v; }
  
  self.debug = function(s){ config.debug && console.log(s); }
  self.getDebug = function(){ return config.debug; }
  self.setDebug = function(f){ config.debug = !!f; }
  
  self.isOpen = function(){ return open; }
  self.setOpen = function(){ open = true; }
  self.setClose = function(){ open = false; }
  
  self.getBinds = function(){ return events.binds||[]; }
  self.setBinds = function(e){ events.binds = e; }
  self.clearBinds = function(){ events.binds = []; }
  
  self.getHandler = function(){ return events.handler; }
  self.setHandler = function(e){ events.handler = e; }
  self.clearHandler = function(){ events.handler = null; }

  self.setCurrentEvent = function(e){ events.current = e; }
  self.getCurrentEvent = function(){ return events.current; }
  
  self.getProps = function(){ return props; }
  self.setProps = function(p){ props = p; }
  
  self.getDatas = function(){ return datas; }
  self.setDatas = function(d){ datas = d; }
  
  self.getData = function(k){ return datas[k]; }
  self.setData = function(k,v){ datas[k]=v; }

  Object.keys(Functions.prototype).forEach(function(proto){
    if( typeof(self[proto]) === 'undefined' ){
      self[proto] = Functions.prototype[proto]
    }
  });
  
  props && self.init();
}

CustomContextMenu.prototype = (function(){
  function _init( self ){
    _bindEvent( self );
  }
  
  function _render( self ){
    _remove( self );
    
    var props = self.getProps();
    var instance = __createElement( self, props );
    
    self.setInstance( instance );
  }
  
  function _unbindEvent( self ){
    if( self.isOpen() ){
      _remove(self);
    }
    
    var handler = self.getHandler();
    
    self.getBinds().forEach(function( el ){
      console.log( 'unbind', el );
      el.removeEventListener('contextmenu', handler, false);
    });
    
    self.clearBinds();
    self.clearHandler();
  }
  
  function _bindEvent( self, elements ){
    var binds = [].concat(elements||self.getBinds());
    
    binds.forEach(function( el ){
      console.log( 'bind', el );
      el.addEventListener('contextmenu', __handleContextMenu( self ), false);
    });
    
    self.setBinds(binds);
  }
  
  function _attach( self, moveX, moveY ){
    _render(self);
    
    var root = self.getConfig('root');
    var instance = self.getInstance();
    
    root.appendChild( instance );
    
    self.setOpen();
    
    if( moveX && moveY ){
      _move( self, moveX, moveY );
    }
  }
  
  function _move( self, moveX, moveY ){
    var instance = self.getInstance('instance');
    var scrollEl = document.querySelector('html');
    
    var gap = self.getConfig('point_gap')||0;
    
    var pointX = moveX + gap;
    var pointY = moveY + gap;
    
    var chkX = ( instance.clientWidth + pointX ) - ( scrollEl.clientWidth + scrollEl.scrollLeft );
    var chkY = ( instance.clientHeight + pointY ) - ( scrollEl.clientHeight + scrollEl.scrollTop );
    
    var posX = chkX >= 0 ? pointX - chkX : pointX;
    var posY = chkY >= 0 ? pointY - chkY : pointY;
    
    instance.style.left = posX+'px';
    instance.style.top = posY+'px';
    
    self.debug(
      JSON.stringify({
        client: {
          width: instance.clientWidth,
          height: instance.clientHeight,
        },
        point: { 
          pointX: pointX, 
          pointY: pointY,
        },
        check: {
          chkX: chkX,
          chkY: chkY,
        },
        position: {
          posX: posX,
          posY: posY
        }
      }, null, 2)
    );
  }
  
  function _remove( self ){
    var root = self.getConfig('root');
    var instance = self.getInstance();
    
    if( instance ){
      root.removeChild( instance );
      self.clearInstance();
    }
    
    self.setClose();
  }
  
  // Private Methods
  function __createElement( self, props ){
    if( props instanceof Array ){
      return props.map(function(_props){
        return __createElement( self, _props );
      });
    } else if( props instanceof Object ) {
      var element = document.createElement( props.type );
      
      var keys = Object.keys(props);
      for(let i = 0; i < keys.length; i++){
        var key = keys[i];
        var value = props[key];
        
        switch( key ){
          case 'visible': 
            if( value === false ) return null;
          case 'type':
            break;
          case 'className':
          case 'classList':
            [].concat(value).forEach(function(className){
              element.classList.add( className );
            })
            break;
          case 'style':
            Object.keys(value).forEach(function(styleName){
              element[key][styleName] = value[styleName];
            });
            break;
          case 'data':
          	var dataType = value.type||'string';
          	var dataName = value.name;
          	
          	var dataValue = self.getData(dataName);
          	if( !dataValue ){ return null; }
          	
          	if( dataType === 'string' ){
      				element.appendChild( document.createTextNode( dataValue||"" ) );
          	} else if ( dataType === 'array' ){
          		if( !Array.isArray(dataValue) ){
          			dataValue = dataValue.split(value.delimiter);
          		}

        			var _props = {}
        			Object.keys( props ).forEach(function(key){
        				if( key !== 'data' ){
        					_props[key] = props[key];
        				}
        			});
          		
          		var data = {
          			length: dataValue.length
          		}
          		
	      			var elements = dataValue.map(function(pv, idx){
	      				
	      				var updated = [].concat( value.children ).map(function( c ){
	      					Object.keys( c ).forEach(function( ck ){
	      						var cv = c[ck];
	      						
	      						if( typeof(cv) === 'string' ){
	      							if( cv.indexOf('data.') ===  0 ){
		    								c[ck] = eval(cv);
		    							}
	      						}
	      					});

      						
	      					var updateProps = {}
	      					if( c.label && c.label === value.item ){
	      						updateProps.label = pv;
	      					}
      						
	      					return Object.assign({}, c, updateProps);;
	      				});
	      				
	      				console.log( updated );
	      				
	      				var filtered = updated.filter(function( c ){
	      					if( c.rowspan && idx !== 0 ){
	      						return false;
	      					}
	      					return true; 
	      				});
	      				
		    				return __createElement( self, Object.assign({}, _props, { children: filtered }) );
		    			});

            	return elements;
          	}
          	break;
          case 'label':
            element.appendChild( document.createTextNode( value||"" ) );
            break;
          case 'onClick': // value: Function
            if( value instanceof Function ){
              element.addEventListener('click', function(event){ value( event, self ); }, false);
            }
            break;
          case 'children': // value: Object, Array
            [].concat( value ).map(function( childrenProps ){
              return __createElement( self, childrenProps );
            }).forEach(function( children ){
              if( children ){
                // Object or Array
                [].concat( children ).forEach(function( _children ){
                  children && element.appendChild( _children );
                });
              }
            });
            break;
          default:
            if( value ){
              element.setAttribute(key, value);
            }
        }
      }
      return element;
    }
    return null;
  }
  
  // Private Methods
  function __handleContextMenu( self ){
    function eventHandler(event){
      event.preventDefault();

      self.setCurrentEvent(event);
      
      if( !self.isOpen() ){
        var root = self.getConfig('root');
        
        function closeContextMenu(_event){
          var target = _event.target;

          var instance = self.getInstance();
          var closest = target.closest('#'+instance.id);

          if( !closest ){
            _remove( self );
            root.removeEventListener('click', closeContextMenu, false);
          }
        }
        root.addEventListener('click', closeContextMenu, false);

        _attach( self );
      }
      
      _move( self, event.pageX, event.pageY );
    }
    
    self.setHandler( eventHandler );
    
    return eventHandler;
  }
  
  return {
    init: function(){
      _init( this );
    },
    setProps: function( props ){
    	this.setProps( props );
    },
    setDatas: function( datas ){
    	this.setDatas( datas );
    },
    bindEvent: function( elements ){    
      _unbindEvent( this );  
      _bindEvent( this, elements );
    },
    unbindEvent: function(){
      _unbindEvent( this );
    },
    setPosition: function( x, y ){
      _setPosition( this, x, y );
    }
  }
})();