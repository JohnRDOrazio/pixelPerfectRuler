let rulerOptions = {
  rulerLength: 6.25, //in inches
  convertToCM: false,
  canvasWidth: 800, //the canvasWidth will be calculated as a conversion of 6.25 inches to css pixels + initialPadding
  canvasHeight: 20,
  canvas: document.getElementById( 'previewRuler' ),
  initialPadding: 35,
  lineWidth: 0.5,
  strokeStyle: '#000',
  font: 'bold 10px Arial',
  tabPos: 0
};
let inchLabel = 'Current tabulation position (1/4 inch increments):';
let cmLabel = 'Current tabulation position (1/2 cm increments):';

const pixelAdjustments = {
  'inches': {
    'dpr_1.25': ( function* () {
      const pattern = [ 0.6, 0, 0.2, 0.4 ];
      let index = 0;

      while ( true ) {
        yield pattern[ index % pattern.length ];
        index++;
      }
    } )(),
    'dpr_1.5': ( function* () {
      const pattern = [ 0 ];
      let index = 0;

      while ( true ) {
        yield pattern[ index % pattern.length ];
        index++;
      }
    } )()
  },
  'cm': {
    'dpr_1.25': ( function* () {
      const pattern = [
        -0.2, 1, 0.3, 0.55, 0.8, 1.05, 1.3, 1.55, 1.8, -1.95, -1.7,
        -1.45, -1.2, -0.95, -0.7, -0.45,
      ];
      let index = 0;

      while ( true ) {
        yield pattern[ index % pattern.length ];
        index++;
      }
    } )(),
    'dpr_1.5': ( function* () {
      const pattern = [
        0, 0.4, 0.2, 0.6, 0, 0.1, 0.5, 0.2
      ];
      let index = 0;

      while ( true ) {
        yield pattern[ index % pattern.length ];
        index++;
      }
    } )()
  }
}

const getPixelRatioVals = function ( convertToCM, rulerLength ) {
    let inchesToCM = 2.54,
      dpr = window.devicePixelRatio, // 1.5625
      ppi = ( 96 * dpr ) / 100, // 1.5 works great for a fullHD monitor with dPR 1.25
      dpi = 96 * ppi, // 144 works great for my fullHD monitor with dPR 1.25
      dpiA = 96 * dpr, // 150
      //for inches we will draw a line every eigth of an inch
      drawInterval = 0.125;
    if ( convertToCM ) {
      ppi = Math.round( ppi / inchesToCM );
      dpi = Math.round( dpi / inchesToCM );
      dpiA = Math.round( dpiA / inchesToCM );
      rulerLength = Math.round( rulerLength * inchesToCM );
      //for centimeters we will draw a line every quarter centimeter
      drawInterval = 0.25;
    }
    return {
      inchesToCM: inchesToCM,
      dpr: dpr,
      ppi: ppi,
      dpi: dpi,
      dpiA: dpiA,
      rulerLength: rulerLength,
      drawInterval: drawInterval
    };
  },
  triangleAt = function ( x, options ) {
    let context = options.context,
      pixelRatioVals = options.pixelRatioVals,
      initialPadding = options.initialPadding;

    let xPosA = x * pixelRatioVals.dpiA;
    context.lineWidth = 0.5;
    context.fillStyle = "#4285F4";
    context.beginPath();
    context.moveTo( initialPadding + xPosA - 6, 11 );
    context.lineTo( initialPadding + xPosA + 6, 11 );
    context.lineTo( initialPadding + xPosA, 18 );
    context.closePath();
    context.stroke();
    context.fill();
  },
  drawRuler = function ( userOptions ) {
    if ( typeof userOptions !== 'object' ) {
      alert( 'bad options data' );
      return false;
    }
    let options = jQuery.extend( {}, {
      rulerLength: 6.25, //in inches
      convertToCM: false,
      canvasWidth: 800,
      canvasHeight: 20,
      canvas: document.getElementById( 'previewRuler' ),
      initialPadding: 35,
      lineWidth: 0.5,
      strokeStyle: '#000',
      font: 'bold 10px Arial',
      tabPos: 0.25
    }, userOptions );
    let context = options.canvas.getContext( '2d' ),
      pixelRatioVals = getPixelRatioVals( options.convertToCM, options.rulerLength ),
      canvas = options.canvas;
    options.context = context;
    options.pixelRatioVals = pixelRatioVals;
    options.canvasWidth = ( options.rulerLength * 96 * pixelRatioVals.dpr ) + ( options.initialPadding * 2 );
    canvas.style.width = options.canvasWidth + 'px';
    canvas.style.height = options.canvasHeight + 'px';
    canvas.width = options.canvasWidth * pixelRatioVals.dpr;
    canvas.height = options.canvasHeight * pixelRatioVals.dpr;
    context.scale( pixelRatioVals.dpr, pixelRatioVals.dpr );

    context.lineWidth = options.lineWidth;
    context.strokeStyle = options.strokeStyle;
    context.font = options.font;

    context.beginPath();
    context.moveTo( options.initialPadding, 1 );
    context.lineTo( options.initialPadding + pixelRatioVals.rulerLength * pixelRatioVals.dpiA, 1 );
    context.stroke();

    let currentWholeNumber = 0;
    let offset = 2; //slight offset to center numbers
    const UnitOfMeasurement = options.convertToCM ? 'cm' : 'inches';
    const snapPixels = pixelAdjustments[ UnitOfMeasurement ][ 'dpr_' + pixelRatioVals.dpr ];

    for ( let interval = 0; interval <= pixelRatioVals.rulerLength; interval += pixelRatioVals.drawInterval ) {
      let xPosA = interval * pixelRatioVals.dpiA + snapPixels.next().value;
      if ( interval == Math.floor( interval ) && interval > 0 ) {
        if ( currentWholeNumber + 1 == 10 ) {
          offset += 4;
        } //compensate number centering when two digits
        context.fillText( ++currentWholeNumber, options.initialPadding + xPosA - offset, 14 );
      } else if ( interval == Math.floor( interval ) + 0.5 ) {
        context.beginPath();
        context.moveTo( options.initialPadding + xPosA, 15 );
        context.lineTo( options.initialPadding + xPosA, 5 );
        context.closePath();
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo( options.initialPadding + xPosA, 10 );
        context.lineTo( options.initialPadding + xPosA, 5 );
        context.closePath();
        context.stroke();
      }
    }
    let xPosB = options.tabPos;
    if ( options.convertToCM ) {
      xPosB *= 2;
    }
    triangleAt( xPosB, options );
  };

switch ( rulerOptions.convertToCM ) {
  case true:
    jQuery( 'input#useCM' ).prop( "checked", true );
    break;
  case false:
    jQuery( 'input#useInches' ).prop( "checked", true );
    break;
}
jQuery( '.controlgroup' ).controlgroup( {
  "direction": "vertical"
} );
jQuery( '#tabPositionSlider' ).slider( {
  min: 0,
  max: rulerOptions.rulerLength,
  value: rulerOptions.tabPos,
  step: 0.25,
  slide: function ( event, ui ) {
    jQuery( '#currentTabPosition' ).val( ui.value );
    rulerOptions.tabPos = rulerOptions.convertToCM ? parseFloat( ui.value / 2 ) : parseFloat( ui.value );
    drawRuler( rulerOptions );
    let pixelRatioVals = getPixelRatioVals( rulerOptions.convertToCM, rulerOptions.rulerLength );
    let paddingLeft = rulerOptions.initialPadding + ( ui.value * pixelRatioVals.dpiA );
    jQuery( "#dummyText" ).css( {
      "padding-left": paddingLeft + "px"
    } );
  }
} );
jQuery( 'label[for=currentTabPosition]' ).text( ( rulerOptions.convertToCM ? cmLabel : inchLabel ) );
jQuery( '#currentTabPosition' ).val( rulerOptions.tabPos );
jQuery( '.controlgroup input' ).on( 'change', function () {
  if ( this.checked ) {
    let curSliderVal, pixelRatioVals, paddingLeft;
    switch ( this.value ) {
      case "useCM":
        rulerOptions.convertToCM = true;
        jQuery( 'label[for=currentTabPosition]' ).text( cmLabel );
        curSliderVal = jQuery( "#tabPositionSlider" ).slider( "value" );
        jQuery( "#tabPositionSlider" ).slider( "option", "max", rulerOptions.rulerLength * 2.54 );
        jQuery( "#tabPositionSlider" ).slider( "option", "step", 0.5 );
        jQuery( "#tabPositionSlider" ).slider( "value", curSliderVal * 2 ); //rulerLength *= inchesToCM
        jQuery( "#currentTabPosition" ).val( ( curSliderVal * 2 ).toString() );
        drawRuler( rulerOptions );
        pixelRatioVals = getPixelRatioVals( rulerOptions.convertToCM, rulerOptions.rulerLength );
        paddingLeft = rulerOptions.initialPadding + ( curSliderVal * 2 * pixelRatioVals.dpiA );
        jQuery( "#dummyText" ).css( {
          "padding-left": paddingLeft + "px"
        } );
        break;
      case "useInches":
        rulerOptions.convertToCM = false;
        jQuery( 'label[for=currentTabPosition]' ).text( inchLabel );
        curSliderVal = jQuery( "#tabPositionSlider" ).slider( "value" );
        jQuery( "#tabPositionSlider" ).slider( "option", "max", rulerOptions.rulerLength );
        jQuery( "#tabPositionSlider" ).slider( "option", "step", 0.25 );
        jQuery( "#tabPositionSlider" ).slider( "value", curSliderVal / 2 );
        jQuery( "#currentTabPosition" ).val( ( curSliderVal / 2 ).toString() );
        drawRuler( rulerOptions );
        pixelRatioVals = getPixelRatioVals( rulerOptions.convertToCM, rulerOptions.rulerLength );
        paddingLeft = rulerOptions.initialPadding + ( curSliderVal / 2 * pixelRatioVals.dpiA );
        jQuery( "#dummyText" ).css( {
          "padding-left": paddingLeft + "px"
        } );
        break;
    }
  }
} );

let bestWidth = rulerOptions.rulerLength * 96 * window.devicePixelRatio + ( rulerOptions.initialPadding * 2 ); // * window.devicePixelRatio
jQuery( '#dummyText' ).css( {
  "width": bestWidth + "px"
} );
drawRuler( rulerOptions );
