document.creationFeuilleDeStyle = (function() {
	function createStyleSheet(href) {
		if(typeof href !== 'undefined') {
			var element = document.createElement('link');
			element.type = 'text/css';
			element.rel = 'stylesheet';
			element.href = href;
		}
		else {
			var element = document.createElement('style');
			element.type = 'text/css';
		}

		document.getElementsByTagName('head')[0].appendChild(element);
		var sheet = document.styleSheets[document.styleSheets.length - 1];

		if(typeof sheet.addRule === 'undefined')
			sheet.addRule = addRule;

		if(typeof sheet.removeRule === 'undefined')
			sheet.removeRule = sheet.deleteRule;

		return sheet;
	}

	function addRule(selectorText, cssText, index) {
		if(typeof index === 'undefined')
			index = this.cssRules.length;

		this.insertRule(selectorText + ' {' + cssText + '}', index);
	}

	return createStyleSheet;
})();

function OxDefilement($conteneur, proprietes) {
	var instance = this;
	var largeurBarre = 16;
	proprietes = $.extend({}, { hauteurContenu: 200,
								largeurContenu: 50,
								postionContenuX: 0,
								postionContenuY: 0,
								barreXVisible: true,
								barreYVisible: true,
								frequenceRafraichissement: 50,					// temps avant que le plugin informe que la position X ou Y a changée.
								vitesseScroll: 0.5,								// vitesse de défilement avec la molette
								deplacementBoutonX: function (positionVueX, origineEvenement) {},
								deplacementBoutonY: function (positionVueY, origineEvenement) {} },
							proprietes);

	var positionXContenu = 0;
	var positionYContenu = 0;

	if (!$conteneur.find("div").length)
		$conteneur.append("<div>");
	var $contenu = $conteneur.find("div");
	$contenu.addClass("ox-contenu");
	var $barreX = $("<div class = 'ox-barreX'></div>");
	var $barreY = $("<div class = 'ox-barreY'></div>");
	var $boutonX = $("<div class = 'ox-boutonX'></div>");
	var $boutonY = $("<div class = 'ox-boutonY'></div>");

	// ajout des styles
	if (!OxDefilement.prototype.estDejaCree) {
		OxDefilement.prototype.estDejaCree = true;
		document.creationFeuilleDeStyle();
		var pF = document.styleSheets.length - 1;
		document.styleSheets[pF].insertRule(".ox-contenu { overflow: hidden; }", 0);
		document.styleSheets[pF].insertRule(".ox-barreY { position: absolute; width: " + largeurBarre + "px; height: 100%; backgroud-color: gray; background-color: #E0E0E0; right: 0; top: 0; }", 0);
		document.styleSheets[pF].insertRule(".ox-barreX { position: absolute; width: 100%; height: " + largeurBarre + "px; backgroud-color: gray; background-color: #E0E0E0; left: 0; bottom: 0; }", 0);
		document.styleSheets[pF].insertRule(".ox-boutonX, .ox-boutonY { width: 20px; height: 20px; background-color: #CDCDCD; min-width: 10px; min-height: 10px; max-width: 100%; max-height: 100%; transition: background-color 0.2s; }", 0);
		document.styleSheets[pF].insertRule(".ox-boutonX:hover, .ox-boutonY:hover { background-color: #a5a5a5; transition: background-color 0.2s; }", 0);
		document.styleSheets[pF].insertRule(".ox-masque:not(.ox-nePlusCache) { opacity: 0; transition: opacity 0.5s; }", 0);
		document.styleSheets[pF].insertRule(".ox-masque:not(.ox-nePlusCache):hover { opacity: 1; transition: opacity 0.5s; }", 0);
		document.styleSheets[pF].insertRule(".ox-masque .ox-boutonY { background-color: #808080; border-radius: 10px; margin: 5px; width: 10px; }", 0);
		document.styleSheets[pF].insertRule(".ox-masque .ox-boutonX { background-color: #808080; border-radius: 10px; margin: 5px; height: 10px; }", 0);
	}

	function initialiser () {
		memDernierDepX = 0;
		memDernierDepY = 0;
		function deplacementX (e) {
			if ($.now() - memDernierDepX < proprietes.frequenceRafraichissement)
				return;
			memDernierDepX = $.now();
			var positionVueX = calculerPositionXContenu();
			if (typeof proprietes.deplacementBoutonX == "function")
				proprietes.deplacementBoutonX(positionVueX, "utilisateur");
		}
		function deplacementY (e) {
			if ($.now() - memDernierDepY < proprietes.frequenceRafraichissement)
				return;
			memDernierDepY = $.now();
			var positionVueY = calculerPositionYContenu();
			if (typeof proprietes.deplacementBoutonY == "function")
				proprietes.deplacementBoutonY(positionVueY, "utilisateur");
		}
		$conteneur.append($barreY);
		$conteneur.append($barreX);
		$barreY.append($boutonY);
		$barreX.append($boutonX);
		$boutonY.draggable({ axis: "y", containment: "parent", start: function() { $barreY.addClass("ox-nePlusCache") }, drag: deplacementY, stop: function() {
																																						$barreY.removeClass("ox-nePlusCache");
																																						var positionVueY = calculerPositionYContenu();
																																						if (typeof proprietes.deplacementBoutonY == "function")
																																							proprietes.deplacementBoutonY(positionVueY, "utilisateur");
																																					} });
		$boutonX.draggable({ axis: "x", containment: "parent", start: function() { $barreX.addClass("ox-nePlusCache") }, drag: deplacementX, stop: function() {
																																						$barreX.removeClass("ox-nePlusCache");
																																						var positionVueX = calculerPositionXContenu();
																																						if (typeof proprietes.deplacementBoutonX == "function")
																																							proprietes.deplacementBoutonX(positionVueX, "utilisateur");
																																					} });
		$conteneur.css("position", "absolute");
		dessiner();
	}

	function gestionVisibilite () {
		proprietes.barreXVisible ? definirLargeurContenuEtBarres(largeurBarre) : $barreX.addClass("ox-masque");
		proprietes.barreYVisible ? definirHauteurContenuEtBarres(largeurBarre) : $barreY.addClass("ox-masque");
	}

	function calculerPositionYContenu () {
		var posBoutonRapportParent = $boutonY.position().top - $barreY.position().top;
		var distanceDeplacement = $barreY.height() - $boutonY.outerHeight(true);
		var positionVueY = posBoutonRapportParent / distanceDeplacement;
		positionYContenu = positionVueY;
		return positionVueY;
	}

	function calculerPositionXContenu () {
		var posBoutonRapportParent = $boutonX.position().left - $barreX.position().left;
		var distanceDeplacement = $barreX.width() - $boutonX.outerWidth(true);
		var positionVueX = posBoutonRapportParent / distanceDeplacement;
		positionXContenu = positionVueX;
		return positionVueX;
	}

	function definirHauteurContenuEtBarres (lB) {
		$contenu.css("height", "calc(100% - " + lB + "px)");
		proprietes.barreYVisible && $barreY.height("calc(100% - " + lB + "px)");
		if (typeof proprietes.retaillageHauteurContenu == "function")
			proprietes.retaillageHauteurContenu($contenu.height());
	}

	function definirLargeurContenuEtBarres (lB) {
		$contenu.css("width", "calc(100% - " + lB + "px)");
		proprietes.barreXVisible && $barreX.width("calc(100% - " + lB + "px)");
		instance.setLargeurContenu(proprietes.largeurContenu);
		if (typeof proprietes.retaillageLargeurContenu == "function")
			proprietes.retaillageLargeurContenu($contenu.width());
	}

	function definirHauteurBoutonY () {
		var hauteurContenu = $contenu.outerHeight(true);
		var rapportConteneurContenu = hauteurContenu / proprietes.hauteurContenu;
		var hauteurBoutonY = Math.round(hauteurContenu * rapportConteneurContenu);
		if (rapportConteneurContenu >= 1 || !hauteurContenu) {							// on cache la barre si le contenu n'a aucune hauteur
			$barreY.hide();
			definirLargeurContenuEtBarres(0);
		}
		else if ($barreY.css("display") == "none"){
			$barreY.show();
			definirLargeurContenuEtBarres(largeurBarre);
		}
		$boutonY.height(hauteurBoutonY);
	}

	function definirLargeurBoutonX () {
		var largeurContenu = $contenu.outerWidth(true);
		var rapportConteneurContenu = largeurContenu / proprietes.largeurContenu;
		var largeurBoutonX = largeurContenu * rapportConteneurContenu;
		if (rapportConteneurContenu >= 1 || !largeurContenu) {							// on cache la barre si le contenu n'a aucune largeur
			$barreX.hide();
			definirHauteurContenuEtBarres(0);
		}
		else if ($barreX.css("display") == "none"){
			$barreX.show();
			definirHauteurContenuEtBarres(largeurBarre);
		}
		$boutonX.width(largeurBoutonX);
	}

	function dessiner () {
		gestionVisibilite ();
		definirHauteurBoutonY();
		definirLargeurBoutonX();
		proprietes.postionContenuX && instance.setPositionXContenu(proprietes.postionContenuX, "systeme");
		proprietes.postionContenuY && instance.setPositionYContenu(proprietes.postionContenuY, "systeme");
	}

	this.getContenu = function () {
		return $contenu;
	}

	this.getPositionYContenu = function () {
		return positionYContenu;
	}

	this.getPositionXContenu = function () {
		return positionXContenu;
	}

	this.getHauteurContenu = function () {
		return $contenu.height();
	}

	this.getLargeurContenu = function () {
		return $contenu.width();
	}

	// x et y compris entre 0 et 1 (pourcentage dans la barre)
	this.setPositionYContenu = function (y, orgEvt) {
		y = y < 0 ? 0 : y > 1 ? 1 : y;
		positionYContenu = y;
		var distanceDeplacement = $barreY.height() - $boutonY.height();
		$boutonY.css("top", distanceDeplacement * y);
		if (typeof proprietes.deplacementBoutonY == "function")
			proprietes.deplacementBoutonY(y, orgEvt ? "systeme" : "utilisateur");
		return instance;
	}

	this.setPositionXContenu = function (x, orgEvt) {
		x = x < 0 ? 0 : x > 1 ? 1 : x || positionXContenu;
		positionXContenu = x;
		var distanceDeplacement = $barreX.width() - $boutonX.width();
		$boutonX.css("left", distanceDeplacement * x);
		if (typeof proprietes.deplacementBoutonX == "function")
			proprietes.deplacementBoutonX(x, orgEvt ? "systeme" : "utilisateur");
		return instance;
	}

	this.setHauteurConteneur = function (hauteur) {
		var posY = instance.getPositionYContenu();
		$conteneur.height(hauteur);
		definirHauteurBoutonY();
		instance.setPositionYContenu(posY, "systeme");
		return instance;
	}

	this.setLargeurConteneur = function (largeur) {
		var posX = instance.getPositionXContenu();
		$conteneur.width(largeur);
		definirLargeurBoutonX();
		instance.setPositionXContenu(posX, "systeme");
		return instance;
	}

	this.setHauteurContenu = function (hauteur) {
		var posY = instance.getPositionYContenu();
		posY = posY * proprietes.hauteurContenu / hauteur;
		proprietes.hauteurContenu = hauteur;
		definirHauteurBoutonY();
		instance.setPositionYContenu(posY, "systeme");
		return instance;
	}

	this.setLargeurContenu = function (largeur) {
		var posX = instance.getPositionXContenu();
		posX = posX * proprietes.largeurContenu / largeur;
		proprietes.largeurContenu = largeur;
		definirLargeurBoutonX();
		instance.setPositionXContenu(posX, "systeme");
		return instance;
	}

	this.detruire = function () {
		$conteneur.remove();
	}
	
	$conteneur.on('wheel', function(e){
		e.preventDefault();
		var direction = e.originalEvent.deltaY < 0 ? 'haut' : 'bas';
		var posY = instance.getPositionYContenu();
		var positionVueY = direction == "bas" ? posY * proprietes.hauteurContenu + $contenu.outerHeight(true) * proprietes.vitesseScroll : posY * proprietes.hauteurContenu - $contenu.outerHeight(true) * proprietes.vitesseScroll;

		if (proprietes.hauteurContenu > $conteneur.height())
			instance.setPositionYContenu(positionVueY / proprietes.hauteurContenu);
	});

	$barreY.on("click", function (e) {
		e.stopPropagation();
		var posBoutonY = $boutonY.offset().top - $barreY.offset().top;
		var posClickY = e.pageY - $barreY.offset().top;
		var extremiteBoutonY = { haut: posBoutonY, bas: posBoutonY + $boutonY.outerHeight(true) };

		var hauteurContenu = $contenu.outerHeight(true);
		var distanceDeplacement = proprietes.hauteurContenu - hauteurContenu;
		var posHaut = instance.getPositionYContenu() * distanceDeplacement;

		if (posClickY < extremiteBoutonY.haut)
			posHaut -= hauteurContenu;
		else if (posClickY > extremiteBoutonY.bas)
			posHaut += hauteurContenu;
		else
			return;
		instance.setPositionYContenu(posHaut / distanceDeplacement);
	});

	$barreX.on("click", function (e) {
		e.stopPropagation();
		var posBoutonX = $boutonX.offset().left - $barreX.offset().left;
		var posClickX = e.pageX - $barreX.offset().left;
		var extremiteBoutonX = { gauche: posBoutonX, droite: posBoutonX + $boutonX.outerWidth(true) };

		var largeurContenu = $contenu.outerWidth(true);
		var distanceDeplacement = proprietes.largeurContenu - largeurContenu;
		var posGauche = instance.getPositionXContenu() * distanceDeplacement;

		if (posClickX < extremiteBoutonX.gauche)
			posGauche -= largeurContenu;
		else if (posClickX > extremiteBoutonX.droite)
			posGauche += largeurContenu;
		else
			return;
		instance.setPositionXContenu(posGauche / distanceDeplacement);
	});

	initialiser();
}

$.fn.OxDefilement = function (options) {
	return this.each(function () {
		var $element = $(this);
		if ($element.data('OxDefilement')) return $element.data('OxDefilement');
		var oObj = new OxDefilement($element, options);
		$element.data('OxDefilement', oObj);
	});
};