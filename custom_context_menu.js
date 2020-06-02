function ContextMenu( props, elements ){
  var instance = null;
  var config = {
    root: document.body,
    debug: false,
    point_gap: 0,
  }  
  var events = {
    binds: [],
    handler: null,
  }
  
  var open = false;
  var props = ( props||{} );
  
  if( elements ){
    if( Array.isArray( elements ) ){
      events.binds = elements;
    } else {
      events.binds.push( elements ); 
    }
  }
    
  this.getInstance = function(){ return instance; }
  this.setInstance = function(a){ instance = a; }
  this.clearInstance = function(a){ instance = null; }
  
  this.getConfig = function(k){ return config[k]; }
  this.setConfig = function(k,v){ config[k] = v; }
  
  this.debug = function(m){ config.debug && console.log(m); }
  this.getDebug = function(){ return config.debug; }
  this.setDebug = function(f){ config.debug = !!f; }
  
  this.isOpen = function(){ return open; }
  this.setOpen = function(){ open = true; }
  this.setClose = function(){ open = false; }
  
  this.getBinds = function(){ return events.binds||[]; }
  this.setBinds = function(a){ events.binds = a; }
  this.clearBinds = function(){ events.binds = []; }
  
  this.getHandler = function(){ return events.handler; }
  this.setHandler = function(e){ events.handler = e; }
  this.clearHandler = function(){ events.handler = null; }
  
  this.getProps = function(){ return props; }
  
  props && this.init( props );
}

ContextMenu.prototype = (function(){
  function _init( self, props ){
    self.props = props;
    
    _loadStyle();
    
    _bindEvent( self );
  }
  
  function _render( self ){
    _remove( self );
    
    var props = self.getProps();
    var instance = __createElement( props );
    
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
  
  function _loadStyle( self ){
    var style = document.createElement('style');
    style.id = 'style-context-menu';
    style.type = 'text/css';
    style.innerHTML = [
      'html, body { height: 100%; }',        
      '.custom-context-menu {',
      '  z-index: 99999999;',
      '  position: absolute;',
      '  box-sizing: border-box;',
      '  min-width: 200px;',
      '  background-color: #ffffff;',
      '  box-shadow: 0 0 0 1px lightgrey;',
      '}',
      '.custom-context-menu table { width: 100%; border: none; border-collapse: collapse; border-spacing: 0; }',
      '.custom-context-menu table tbody { background-color: #ffffff; }',
      '.custom-context-menu table tr {	height: 2.5em; }',
      '.custom-context-menu table tr:hover { background-color: #e9e9e9; }',
      '.custom-context-menu table th,',
      '.custom-context-menu table td { padding: 0.2em 0.5em; }',
    ].join('\n');
    
    var prevStyle = document.getElementById( style.id );
    if( prevStyle ){
      document.head.removeChild( prevStyle );
    }
    document.head.appendChild( style );
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
  function __createElement( props ){
    if( props instanceof Array ){
      return props.map(function(_props){
        return __createElement( _props );
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
          case 'label':
            element.appendChild( document.createTextNode( value||"" ) );
            break;
          case 'onClick': // value: Function
            if( value instanceof Function ){
              element.addEventListener('click', value, false);
            }
            break;
          case 'children': // value: Object, Array
            [].concat( value ).map(function( childrenProps ){
              return __createElement( childrenProps );
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
      
      var root = self.getConfig('root');
      
      
      if( !self.isOpen() ){
        
        _attach( self );
            
        function closeContextMenu(event){
          console.log( 'click' );
          _remove( self );
          
          root.removeEventListener('click', closeContextMenu, false);
        }
        root.addEventListener('click', closeContextMenu, false);
      }
      
      _move( self, event.pageX, event.pageY );
    }
    
    self.setHandler( eventHandler );
    
    return eventHandler;
  }
  
  return {
    init: function( props ){
      _init( this, props );
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





var contextMenu = new ContextMenu({
  type: 'div',
  id: 'custom-context-menu',
  className: 'custom-context-menu',
  children: {
    type: 'table',
    id: 'ctx-menu-table',
    className: 'ctx-menu-table',
    border: 1,
    children: {
      type: 'tbody',
      children: [
        { 
          type: 'tr',
          children: [
            { type: 'th', label: 'text' }
          ]
        }
      ]
    }
  }
}, document.body);

//contextMenu.bindEvent( document.querySelector('#logo-default') )