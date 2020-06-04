/* Polyfill: Element.closest */
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

/* Polyfill: Object.assign */
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
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


function CustomContextMenu( _config ){
  var self = this;

  var instance = null;
  var datas ={}
  var open = false;
  var config = {
    debug: false,
    root: document.body,
    target: [],
    props: {},
    point_gap: 0,
    defaultClassName: 'custom-context-menu',
  }
  
  var events = {
    contextMenu: {
      type: null,
      handler: null,
      binds: [],
    },
    closeContext: {
      type: null,
      handler: null,
      binds: [],
    },
    closeOtherContext: {
      type: null,
      handler: null,
      binds: [],
    }
  }
  
  if( _config ){
    config = Object.assign({}, config, _config);
  }
    
  self.getInstance = function(){ return instance; }
  self.setInstance = function(i){ instance = i; }
  self.clearInstance = function(i){ instance = null; }
  
  self.getConfig = function(k){ return config[k]; }
  self.setConfig = function(k,v){ config[k] = v; }
  
  self.debug = function(a, b){ config.debug && console.log( a, b ); } // [].map.call(arguments, function(m){ return m; })
  self.getDebug = function(){ return config.debug; }
  self.setDebug = function(f){ config.debug = !!f; }
  
  self.isOpen = function(){ return open; }
  self.setOpen = function(){ open = true; }
  self.setClose = function(){ open = false; }
  
  self.getProps = function(){ return config.props; }
  self.setProps = function(p){ config.props = p; }
  
  self.getDatas = function(){ return datas; }
  self.setDatas = function(d){ datas = d; }
  
  self.getData = function(k){ return datas[k]; }
  self.setData = function(k,v){ datas[k]=v; }
  
  self.setEvent = function(k,t,h,b){ events[k] = {type:t||null, handler:h||null, binds:b||[]} }
  self.getEvent = function(k){ return events[k]; }
  self.clearEvent = function(k){ events[k] = {type: null, handler: null, binds: []} }
  
  self.getEventBinds = function(k){ return events[k].binds||[]; }
  self.setEventBinds = function(k,b){ events[k] ? events[k].binds = b : self.setEvent(k,null,null,b); }
  self.clearEventBinds = function(k){ events[k].binds = []; }
  self.addEventBind = function(k,b){ events[k].binds.push(b); }
  
  self.getEventHandler = function(k){ return events[k].handler; }
  self.setEventHandler = function(k,t,h){ events[k].type = t; events[k].handler = h; }
  self.clearEventHandler = function(k){ events[k].type = null; events[k].handler = null; }

  Object.keys(Functions.prototype).forEach(function(proto){
    if( typeof(self[proto]) === 'undefined' ){
      self[proto] = Functions.prototype[proto]
    }
  });
  
  config.props && self.init();
}

CustomContextMenu.prototype = (function(){
  function _init( self ){
    var target = self.getConfig('target');
    
    _initEvent( self );
    _initBindEvent( self, target );
  }
  
  function _render( self ){
    self.debug('_render');
    var root = self.getConfig('root');
    var props = self.getProps();
    var instance = self.getInstance();
    var newInstance = _createElement( self, props );
    
    newInstance.classList.add( self.getConfig('defaultClassName') );
    
    if( instance ){
      self.debug('_reRender');
      root.replaceChild( newInstance, instance );
    } else {
      self.debug('_initRender');
      root.appendChild( newInstance );
    }
    
    self.setInstance( newInstance );
  }
  
  function _initEvent( self ){
    self.debug('_initEvent');
    var contextMenuHandler = __handleContextMenu( self );
    var closeContextHandler = __handleCloseContextMenu(self);
    var closeOtherContextHandler = __handleCloseOtherContextMenu(self);
    
    self.setEvent('contextMenu', 'contextmenu', contextMenuHandler);
    self.setEvent('closeContext', 'click', closeContextHandler);
    self.setEvent('closeOtherContext', 'contextmenu', closeOtherContextHandler);
  }
  
  function _initBindEvent( self, elements ){
    self.debug('_initBindEvent', elements);
    
    _bindEvent(self, 'contextMenu', elements);
  }
  
  function _bindEvent( self, eventName, elements ){
    self.debug('_bindEvent');
    
    var evt = self.getEvent(eventName);
    var binds = [].concat(evt.binds, elements||[]);

    self.debug('_bindEvent.evt', evt);
    self.debug('_bindEvent.binds', binds);
    
    binds.forEach(function( el ){
      el.addEventListener(evt.type, evt.handler, false);
    });
    
    self.setEventBinds(eventName, binds);
  }
  
  function _unbindEvent(self, eventName){
    self.debug('_unbindEvent', eventName);
    
    var evt = self.getEvent(eventName);
    self.debug('_unbindEvent.evt', evt);
    if( evt ){
      if( evt.binds ){
        evt.binds.forEach(function(el){
          el.removeEventListener(evt.type, evt.handler, false);
        });        
        self.clearEventBinds( eventName );
      }
    }
  }
  
  function _remove( self ){
    self.debug('_remove');
    
    var root = self.getConfig('root');
    var instance = self.getInstance();
    
    if( instance && instance.parentElement ){
      root.removeChild( instance );
      self.clearInstance();
    }
    
    self.setClose();
  }
  
  function _move( self, moveX, moveY ){
    self.debug('_move', {x:moveX, y:moveY});
    
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
    
    self.debug({
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
    });
  }
  
  // Private Methods
  function _createElement( self, props ){
    if( props instanceof Array ){
      return props.map(function(_props){
        return _createElement( self, _props );
      });
    } else if( props instanceof Object ) {
      var element = document.createElement( props.type );
      
      var keys = Object.keys(props);
      for(let i = 0; i < keys.length; i++){
        var key = keys[i];
        var value = props[key];
        
        switch( key ){
          case 'type':
          case 'format':
            break;
          case 'visible': 
            if( value === false ) return null;
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
            
            var dataValue = self.getData( dataName );
            if( !dataValue ){ return null; }
            
            if( dataType === 'string' ){
              if( props.format ){
                var format = props.format;
                var charLength = format.split("").filter(function(s){
                  return s === '#';
                }).length;
                
                if( charLength === dataValue.length ){
                  var pivot = 0;
                  
                  dataValue = format.split(/[^#]/g).reduce(function(p,c,i){
                    if( i === 1 ){
                      pivot = p.length;

                      p = dataValue.slice(0, pivot);
                      p += format.charAt(pivot);

                    }
                    p += dataValue.slice(pivot, pivot+c.length);
                    p += format.charAt(p.length);
                    pivot = pivot+c.length;

                    return p;
                  });
                }
              }
              element.appendChild( document.createTextNode( dataValue||"" ) );
            } else if ( dataType === 'array' ){
              var arrValue = [];
              
              if( !Array.isArray(dataValue) ){
                arrValue = dataValue.split( value.delimiter );
              }

              var _props = {}
              Object.keys( props ).forEach(function(key){
                if( key !== 'data' ){
                  _props[key] = props[key];
                }
              });
              
              var data = {
                length: arrValue.length
              }
              
              var elements = arrValue.map(function(pv, idx){
                var updated = [].concat( value.children ).map(function( c ){
                  var updateProps = Object.assign({}, c);
                  
                  Object.keys( updateProps ).forEach(function( uk ){
                    var uv = updateProps[uk];
                    
                    if( typeof(uv) === 'string' ){
                      if( uv.indexOf('data.') ===  0 ){
                        updateProps[uk] = eval(uv);
                      }
                    }
                  });
                  
                  if( updateProps.label && updateProps.label === value.item ){
                    updateProps.label = pv;
                  }
                  return updateProps;
                });
                
                var filtered = updated.filter(function( c ){
                  if( c.rowspan && idx !== 0 ){
                    return false;
                  }
                  return true; 
                });
                
                return _createElement( self, Object.assign({}, _props, { children: filtered }) );
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
              return _createElement( self, childrenProps );
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
    self.debug('__handleContextMenu');
    
    function eventHandler(event){
      event.preventDefault();
      
      self.debug('event', self.isOpen());
      self.debug('event', self.getInstance());
      
      if( !self.isOpen() ){
        _render(self);
        
        _bindEvent(self, 'closeContext', self.getConfig('root'));
      }
      
      _move( self, event.pageX, event.pageY );

      self.setOpen();
    }
    
    return eventHandler;
  }
  
  
  function __handleCloseContextMenu(self){
    self.debug('__handleCloseContextMenu');
    
    function eventHandler(event){
      console.log('close');
      
      var root = self.getConfig('root');
      var target = event.target;
      
      var instance = self.getInstance();
      if( instance ){
        var closest = target.closest('.'+instance.className);
        if( !closest ){
          _remove( self );
          
          _unbindEvent(self, 'closeContext');
        }
      } else {        
        _unbindEvent(self, 'closeContext');
      }
    }
    
    return eventHandler;
  }
  
  function __handleCloseOtherContextMenu(self){
    self.debug('__handleCloseOtherContextMenu');
    
    function eventHandler(event){
      var evt = self.getEvent( eventName );
      var root = self.getConfig('root');
      var instance = self.getInstance();
      
      var binded = self.getEventBinds('contextMenu').filter(function(e){
        return e.contains( event.target );
      });
      if( binded.length === 0 && ( instance && !instance.contains(event.target) ) ){
        _remove(self);
      }
      
      _unbindEvent(self, 'closeOtherContext');
    }
    
    return eventHandler;
  }
  
  
  return {
    init: function(){
      _init( this );
      return this;
    },
    setProps: function( props ){
      this.setProps( props );      
      return this;
    },
    setDatas: function( datas ){
      this.setDatas( datas );      
      return this;
    },
    bindEvent: function( elements ){
      _bindEvent( this, 'contextMenu', elements );
    },
    unbindEvent: function(){
      _unbindEvent( this );
    },
    open: function( event, el, datas){
      this.debug('open');
      
      var binded = this.getEventBinds('contextMenu').filter(function(e){
        return e === el;
      });
      if( binded.length === 0 ){
        this.addEventBind('contextMenu', el);
      }
      
      this.debug('contextMenu.binds', this.getEventBinds('contextMenu'))
      
      if( datas ){
        this.setDatas( datas );
      }
      
      if( this.isOpen() ){
        _render( this );
      }
      
      __handleContextMenu(this)( event );
    },
    close: function(){
      _remove( this );
    }
  }
})();
