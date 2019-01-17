function OxSaisie (conteneur, proprietes) {
	var instance = this;
	var valeur = conteneur.value;
	var sdd;
	var listeDeValeurs = document.createElement("div");
	var listeDeValeursEstUtilisee = false;
	var nbEltAffichables;
	var nbEltAffiches;
	var objDefilement;
	var positionVue = 0;
	var derniereSaisie;
	var listeElements = new Array();

	proprietes = $.extend({}, {
		valeur: conteneur.value,
		visible: true,
		desactive: conteneur.attributes && conteneur.attributes.disabled && conteneur.attributes.disabled.value != "false" || false,
		lectureSeule: conteneur.attributes && conteneur.attributes.readonly && conteneur.attributes.readonly.value != "false" || false,
		nbMaxCaracteres: conteneur.attributes && conteneur.attributes.maxlength && parseInt(conteneur.attributes.maxlength.value),
		autoCompletion: false,
		nbCaractereAvantEnvoie: 3,
		hauteurListeDeValeurs: 100,
		largeurListeValeur: null,
		changement: null,
		nouveauCaractere: null
	},
	proprietes);

	const TITRE = proprietes.nomProprietes && proprietes.nomProprietes.titre || "titre";

	// ajout des styles
	document.createStyleSheet();
	var pF = document.styleSheets.length - 1;
	document.styleSheets[pF].insertRule(".ox-listeDeValeurs { position: absolute; background-color: white; border: 1px black solid; display: none; z-index: 100; }", 0);
	document.styleSheets[pF].insertRule(".ox-element { height: 20px; width: calc\(100% - auto\); color: #555555; cursor: pointer; margin: 2px 4px 0; padding-left: 5px; overflow: hidden; border-radius: 5px; transition: background-color 0.2s; ", 0);
	document.styleSheets[pF].insertRule(".ox-element:hover { background-color: #e3f5fb; transition: background-color 0.2s; }", 0);
	document.styleSheets[pF].insertRule(".ox-listeDeValeurs .ox-barreX, .ox-listeDeValeurs .ox-barreY { background-color: #d5e9f0; }", 0);
	document.styleSheets[pF].insertRule(".ox-listeDeValeurs .ox-boutonX, .ox-listeDeValeurs .ox-boutonY { background-color: #a7d7e7; }", 0);
	document.styleSheets[pF].insertRule(".ox-listeDeValeurs .ox-boutonX:hover, .ox-listeDeValeurs .ox-boutonY:hover { background-color: #89bacb; }", 0);
	document.styleSheets[pF].insertRule(".texteRecherche { font-weight: bold; }", 0);

	(function initialiser () {
		if (proprietes.valeur)
			conteneur.value = proprietes.valeur;
		if (proprietes.nbMaxCaracteres)
			conteneur.setAttribute("maxlength", proprietes.nbMaxCaracteres);
		else
			conteneur.removeAttribute("maxlength");
		if (proprietes.desactive)
			conteneur.setAttribute("disabled", proprietes.desactive);
		else
			conteneur.removeAttribute("disabled");
		if (proprietes.lectureSeule)
			conteneur.setAttribute("readonly", proprietes.lectureSeule);
		else
			conteneur.removeAttribute("readonly");
		if (proprietes.visible)
			delete conteneur.style.display;
		else
			conteneur.style.display = "none";
		if (proprietes.autoCompletion) {
			$(conteneur).after(listeDeValeurs);
			listeDeValeurs.className = "ox-listeDeValeurs";
			listeDeValeurs.style.top = conteneur.offsetTop + conteneur.offsetHeight + "px";
			listeDeValeurs.style.left = conteneur.offsetLeft + "px";
			listeDeValeurs.style.height = proprietes.hauteurListeDeValeurs + "px";
			listeDeValeurs.style.width = proprietes.largeurListeValeur || conteneur.offsetWidth - 2 + "px";

			$(listeDeValeurs).OxDefilement({ hauteurContenu: proprietes.hauteurListeDeValeurs / 2, largeurContenu: conteneur.offsetWidth / 2,
				deplacementBoutonY: function (position, orgEvt) {
					if (orgEvt == "utilisateur") {
						var pos = Math.round((nbEltAffichables - nbEltAffiches) * position);
						instance.afficher(pos);
					}
				},
				deplacementBoutonX: function (position, orgEvt) {
					if (orgEvt == "utilisateur") {
						var pos = Math.round((Element.prototype.longueur - objDefilement.getLargeurContenu() + 20) * position);
						$(".ox-element").css("textIndent", pos * -1);
					}
				}
			});
			objDefilement = $(listeDeValeurs).data("OxDefilement");
			creerStructure();
		}
	})();

	function creerStructure() {
		if (listeElements.length)
			for (var i = 0 ; i < listeElements.length ; i++)
				listeElements[i].detruire();
		listeElements = new Array();
		definirNbElementsAffiches();
		while (listeElements.length < nbEltAffiches) {
			listeElements.push(new Element());
			objDefilement.getContenu().append(listeElements[listeElements.length - 1].getHtml());
		}
	}

	function getHauteurElement() {
		if (listeElements && listeElements.length)
			return $(listeElements[1].getHtml()).outerHeight(true);
		var elt = new Element({});
		objDefilement.getContenu().append(elt.getHtml());
		var hauteur = objDefilement.getContenu().find(".ox-element").outerHeight(true);
		elt.detruire();
		return hauteur;
	}

	function definirNbElementsAffiches () {
		listeDeValeurs.style.display = "block";
		nbEltAffiches = Math.ceil(objDefilement.getHauteurContenu() / getHauteurElement());
		listeDeValeurs.style.display = "none";
	}

	function changement (e, orgEvt) {
		if (typeof proprietes.changement == "function" && !listeDeValeursEstUtilisee)
			proprietes.changement(conteneur.value, e, orgEvt ? orgEvt : "utilisateur");
	}

	function nouveauCaractere (e) {
		if (proprietes.autoCompletion) {
			if (conteneur.value.length >= proprietes.nbCaractereAvantEnvoie && typeof proprietes.nouveauCaractere == "function") {
				derniereSaisie = $.now();
				setTimeout(function () {
					if ($.now() - derniereSaisie >= 500){
						proprietes.nouveauCaractere(conteneur.value, e, "utilisateur");
						derniereSaisie = $.now();
					}
				}, 500);
			}
		}
	}

	function fermetureListeDeValeurs (e) {
		if ($(listeDeValeurs).is(":visible"))
			$(listeDeValeurs).hide("slide", { direction : "up" });
		listeDeValeursEstUtilisee = false;
	}

	this.valeur = function(valeur) {
		if (valeur != undefined && valeur != null)
			conteneur.value = valeur;
		else
			return conteneur.value;
	}

	this.setNbMaxCaracteres = function(max) {
		proprietes.nbMaxCaracteres = max;
		conteneur.setAttribute("maxlength", proprietes.nbMaxCaracteres);
	}

	this.actif = function(etat) {
		if (etat) {
			proprietes.desactive = false;
			conteneur.removeAttribute("disabled");
		}
		if (etat == false) {
			proprietes.desactive = true;
			conteneur.setAttribute("disabled", proprietes.desactive);
		}
		else
			return conteneur.getAttribute("disabled");
	}

	this.visible = function(etat) {
		if (etat == undefined)
			return !conteneur.style.display || conteneur.style.display == "inline" ? true : false;
		conteneur.style.display = etat ? "inline" : "none";
	}

	this.lectureSeule = function(etat) {
		if (etat) {
			proprietes.lectureSeule = false;
			conteneur.removeAttribute("readonly");
		}
		if (etat == false) {
			proprietes.lectureSeule = true;
			conteneur.setAttribute("readonly", proprietes.lectureSeule);
		}
		else
			return conteneur.getAttribute("readonly");
	}

	this.remplirListeDeValeurs = function(donnees) {
		sdd = new oxSourceDeDonnees(donnees);
		nbEltAffichables = donnees.length;
		definirNbElementsAffiches();
		if (donnees.length * getHauteurElement() < proprietes.hauteurListeDeValeurs)
			listeDeValeurs.style.height = donnees.length * getHauteurElement() + "px";
		else
			listeDeValeurs.style.height = proprietes.hauteurListeDeValeurs + "px";
		listeDeValeurs.style.display = "block";
		objDefilement.setLargeurContenu(0);
		objDefilement.setHauteurContenu(donnees.length * getHauteurElement());
		listeDeValeurs.style.display = "none";
	}

	this.afficher = function(position) {
		positionVue = position || 0;
		listeDeValeursEstUtilisee = true;
		Element.prototype.longueur = 0;

		for (var i = 0 ; i < listeElements.length && i < sdd.getElements().length ; i++)
			listeElements[i].setDonnees(sdd.getElements(null, positionVue + i));

		$(listeDeValeurs).show("slide", { direction : "up" });
		var hauteurListe = listeElements.length * getHauteurElement();

		var diff = parseInt(listeDeValeurs.style.height.replace("px", '')) - hauteurListe;
		if (position == 1)
			listeElements[0].getHtml().style.marginTop = diff + "px";
		else
			listeElements[0].getHtml().style.marginTop = "";

		objDefilement.setLargeurContenu(Element.prototype.longueur);
		// si la liste déroulante est trop petite on l'aggrandie pour éviter que le scroll X ne masque de l'info
		if (parseInt(listeDeValeurs.style.width.replace("px", '')) < Element.prototype.longueur && parseInt(listeDeValeurs.style.height.replace("px", '')) < proprietes.hauteurListeDeValeurs)
			listeDeValeurs.style.height = parseInt(listeDeValeurs.style.height.replace("px", '')) + 20 + "px";
	}

	this.detruire = function () {
		conteneur.removeEventListener("change", changement);
		conteneur.removeEventListener("keyup", nouveauCaractere);
		document.body.removeEventListener("click", fermetureListeDeValeurs);
	}

	function Element () {
		var elt = this;
		var donnees;
		var html = document.createElement("div");
		html.className = "ox-element";

		function selection (e) {
			conteneur.value = donnees[TITRE];
			fermetureListeDeValeurs();
			if (typeof proprietes.changement == "function")
				proprietes.changement(donnees, e, "utilisateur");
		}

		this.getHtml = function () {
			return html;
		}

		this.setDonnees = function (d) {
			donnees = d;
			var texteRecherche = new RegExp(conteneur.value, 'gi');
			function recherche (texte) {
				return "<span class = 'texteRecherche'>" + texte + "</span>"
			}
			html.innerHTML = donnees[TITRE].replace(texteRecherche, recherche);
			var baliseTemporaire = document.createElement("span");
			baliseTemporaire.innerHTML = donnees[TITRE].replace(texteRecherche, recherche);
			document.body.appendChild(baliseTemporaire);
			Element.prototype.longueur = baliseTemporaire.offsetWidth > Element.prototype.longueur ? baliseTemporaire.offsetWidth : Element.prototype.longueur;
			baliseTemporaire.remove();
		}

		this.detruire = function () {
			html.removeEventListener("click", selection);
			try { html.remove(); }
			catch (e) { html.parentNode.removeChild(html); }							// cet incapable d'ie ne connait pas remove()
		}

		html.addEventListener("click", selection);
	}

	conteneur.addEventListener("change", changement);
	conteneur.addEventListener("keyup", nouveauCaractere);
	document.body.addEventListener("click", fermetureListeDeValeurs);
}

$.fn.OxSaisie = function (options) {
	return this.each(function (key, value) {
		var $element = $(this);
		if ($element.data('OxSaisie'))
			return $element.data('OxSaisie');
		var oObj = new OxSaisie(this, options);
		$element.data('OxSaisie', oObj);
	});
};