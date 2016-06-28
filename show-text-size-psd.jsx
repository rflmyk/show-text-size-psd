#target photoshop


(function(){
	if(!documents.length){
		alert('Do you need to open a file!');
	} else {
		var r = confirm('Can going create a document, listing all fonts and size used in this PSD, let\'s go?');
		r === true ? main() : alert('Ok we stopping here.') ;   
	} 
}());

function getVisibleTextLayers(doc, layers) {
  var layersCount = doc.layers.length;
  
  for (var layersIndex = 0; layersIndex < layersCount; layersIndex++) {
    var layer = doc.layers[layersIndex];
    
    if (layer.visible) {
      if (layer.typename == "LayerSet") {
        getVisibleTextLayers(layer, layers);
      } else if (isTextLayer(layer)) {
        layers.push(layer);
      }
    }
  }
}

function isTextLayer(layer) {
	if (layer.typename == "ArtLayer") {
		if (layer.kind == "LayerKind.TEXT") {
			return true;
		}
	}
	return false;
}

function userFriendlyConstant(obj) {
	if (obj == "TypeUnits.PIXELS")
		return "px";
	else if (obj == "TypeUnits.POINTS") {
		return "pt";
	} else {
		return "See file the Phtoshop, type unit not is pixel nor and point.";
	}
}


function positionLayer( lyr, x, y ){
	if(lyr.iisBackgroundLayer||lyr.positionLocked) return;

	var layerBounds = lyr.bounds,
		layerX = layerBounds[0].value,
		layerY = layerBounds[1].value,
		deltaX = x-layerX,
		deltaY = y-layerY;

	lyr.translate (deltaX, deltaY);
}

function fillBehind( color ) { 
    var desc = new ActionDescriptor();
    desc.putEnumerated( charIDToTypeID( "Usng" ), charIDToTypeID( "FlCn" ), charIDToTypeID( "Clr " ) );
    
    var colorDesc = new ActionDescriptor();
    colorDesc.putUnitDouble( charIDToTypeID( "H   " ), charIDToTypeID( "#Ang" ), color.hsb.hue );
    colorDesc.putDouble( charIDToTypeID( "Strt" ), color.hsb.saturation  );
    colorDesc.putDouble( charIDToTypeID( "Brgh" ), color.hsb.brightness  );
    
    desc.putObject( charIDToTypeID( "Clr " ), charIDToTypeID( "HSBC" ) , colorDesc );
    desc.putUnitDouble( charIDToTypeID( "Opct" ), charIDToTypeID( "#Prc" ), 100.000000 );
    desc.putEnumerated( charIDToTypeID( "Md  " ), charIDToTypeID( "BlnM" ), charIDToTypeID( "Bhnd" ) );
    executeAction( charIDToTypeID( "Fl  " ), desc, DialogModes.NO );
}

function fillLayer(layer) {

	var a = [layer.bounds[0], layer.bounds[1]],
		b = [layer.bounds[2], layer.bounds[1]],
		c = [layer.bounds[0], layer.bounds[3]],
		d = [layer.bounds[2], layer.bounds[3]],
		fillColor = new SolidColor();

	fillColor.rgb.red = 255;
	fillColor.rgb.green = 0;
	fillColor.rgb.blue = 0;

	activeDocument.selection.select([c, d, b, a], SelectionType.REPLACE, 0, false);
	activeDocument.selection.expand(10);
	activeDocument.selection.fill(fillColor, ColorBlendMode.NORMAL, 70, false);
}

function getFontDisplay(textItemRef) {
	return textItemRef.font + '\r' + Math.round(textItemRef.size) + ' ' + userFriendlyConstant(app.preferences.typeUnits) + ' #' + textItemRef.color.nearestWebColor.hexValue;
}

function getFontSize(textItemRef) {
	return Math.round(textItemRef.size) + userFriendlyConstant(app.preferences.typeUnits);
}

function getFontName(textItemRef) {
	return textItemRef.font;
}

function include(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function callSaveForWeb(randonString, folderForSave){  
	if(!documents.length) return;  

	if(confirm("Want to generate JPG of the PSD?")){

		var Name = app.activeDocument.name.replace(/\.[^\.]+$/, ''),
			fileJPG = File(folderForSave.absoluteURI+'/'+randonString+'-'+ Name + ".jpg"); 

		if(fileJPG.exists){  
			if(!confirm("Overwrite existing document?")) return;  
		    fileJPG.remove();  
		}  
		SaveForWeb(fileJPG,60);  
	}
}  

function SaveForWeb(fileJPG,jpegQuality) {  
	var opt = new ExportOptionsSaveForWeb();   
		opt.format = SaveDocumentType.JPEG;   
		opt.includeProfile = false;   
		opt.interlaced = 0;   
		opt.optimized = true;   
		opt.quality = jpegQuality; 

	activeDocument.exportDocument(fileJPG, ExportType.SAVEFORWEB, opt);  
} 

function main(){
	if(!documents.length) return;

	var layerCompsCount = activeDocument.layerComps.length,
		randomname = Number(new Date()),
		folderForSaveFile = Folder.selectDialog ("Please choose a location where the new files will be saved.", "~/Desktop/"),
		fileTxt =new File(folderForSaveFile.absoluteURI+'/'+randomname+'-'+app.activeDocument.name.replace(/\.[^\.]+$/, '')+".txt"); 

	fileTxt.open('w'); 
	fileTxt.write('Please wait, processing the file...'); 
	fileTxt.close();		

	app.preferences.rulerUnits = Units.PIXELS;
	app.preferences.typeUnits = TypeUnits.PIXELS;
	app.displayDialogs = DialogModes.NO;

	if (layerCompsCount > 0) {  
		alert('No support for comps yet');  
	} else {
		var layers = [],
		    fontSize =  [],
		    nameFont = [],
		    answer = confirm('Want to write in the PSD, font size, color and names?'),
		    msg;

		getVisibleTextLayers(activeDocument, layers);

		var fillLayerRef = activeDocument.artLayers.add();
		fillLayerRef.name = "Hints background color";
		fillLayerRef.kind = LayerKind.NORMAL;
		    
		for (layerIndex = 0; layerIndex < layers.length; layerIndex++) {
			layer = layers[layerIndex];

			if(answer){
				var artLayerRef = activeDocument.artLayers.add();
				artLayerRef.kind = LayerKind.TEXT;

				var textItemRef = artLayerRef.textItem;
				textItemRef.contents = getFontDisplay(layer.textItem);

				var textColor = new SolidColor();
				textColor.rgb.red = 255;
				textColor.rgb.green = 255;
				textColor.rgb.blue = 255;

				textItemRef.color = textColor;
				textItemRef.size = 12;

				positionLayer(artLayerRef, layer.bounds[0], layer.bounds[1]);
				activeDocument.activeLayer = fillLayerRef;
				fillLayer(artLayerRef);

				artLayerRef = null;
				textItemRef = null;
			}


			if( !include(fontSize, getFontSize(layer.textItem)) ){
				fontSize.push(getFontSize(layer.textItem));
			}

			if( !include(nameFont, getFontName(layer.textItem)) ){
				nameFont.push(getFontName(layer.textItem));
			}      
		}

		msg = nameFont.length;
		nameFont.length > 1 ? msg += ' font(s) were found, are they:\r\n\r\n' : msg += ' font was found:\r\n\r\n' ;
		msg += nameFont.sort().join('\n');
		msg += '\r\n\r\n-------------------------\r\n\r\n\r\n';
		msg += 'And ';
		msg += fontSize.length;
		fontSize.length > 1 ? msg += ' font(s) size were used, are they:\r\n\r\n' : msg += ' font size were used, was:\r\n\r\n' ;
		msg += fontSize.sort().join('\n');

		fileTxt.open('w'); 
		fileTxt.write(msg+'\r\n\r\n-------------------------\r\n\r\n\r\nProcessing complete!'); 
		fileTxt.close();

		callSaveForWeb(randomname, folderForSaveFile);    
	}
}