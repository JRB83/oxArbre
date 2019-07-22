/**
 * @class OxArbre
 * @classdesc gestion hiérarchique de données
 *
 * @param {jQuery} $conteneur
 * @param {objet} proprietes
 *
 * @property {OxArbre} instance
 * @property {oxSourceDeDonnees} sdd
 */
function OxArbre ($conteneur, proprietes) {
	var instance = this;
	var sdd;
	proprietes = $.extend({}, { nomAnimation: "blind" },
							proprietes);
	var noeudSelectionne;
	var noeudsCoches = new Array();

	const TITRE = proprietes.nomProprietes && proprietes.nomProprietes.titre || "titre";
	const FILS = proprietes.nomProprietes && proprietes.nomProprietes.fils || "OxFils";
	const IMAGE = proprietes.nomProprietes && proprietes.nomProprietes.image || "image";
	const SVG = proprietes.nomProprietes && proprietes.nomProprietes.svg || "svg";
	const ESTDEPLOYE = proprietes.nomProprietes && proprietes.nomProprietes.estDeploye || "estDeploye";
	const MULTISELECTION = proprietes.nomProprietes && proprietes.nomProprietes.multiselection || "multiselection";
	const STYLEETENDEUR = proprietes.nomProprietes && proprietes.nomProprietes.styleEtendeur || "styleEtendeur";
	const STYLEICONE = proprietes.nomProprietes && proprietes.nomProprietes.styleIcone || "styleIcone";
	const STYLETITRE = proprietes.nomProprietes && proprietes.nomProprietes.styleTitre || "styleTitre";
	const CLASSE = proprietes.nomProprietes && proprietes.nomProprietes.classe || "classe";
	const CLASSEICONE = proprietes.nomProprietes && proprietes.nomProprietes.classeIcone || "classeIcone";
	const CLASSETEXTE = proprietes.nomProprietes && proprietes.nomProprietes.classeTexte || "classeTexte";
	const ESTSELECTIONNE = proprietes.nomProprietes && proprietes.nomProprietes.estSelectionne || "estSelectionne";
	const ESTSELECTIONNABLE = proprietes.nomProprietes && proprietes.nomProprietes.estSelectionnable || "estSelectionnable";
	const ESTCOCHE = proprietes.nomProprietes && proprietes.nomProprietes.estCoche || "estCoche";
	const GLISSERDEPOSER = proprietes.nomProprietes && proprietes.nomProprietes.glisserDeposer || "glisserDeposer";
	const GLISSERRESTREINTAUNOEUD = proprietes.nomProprietes && proprietes.nomProprietes.glisserRestreintAuNoeud || "glisserRestreintAuNoeud";
	const DEPOSERRESTREINTAUNOEUD = proprietes.nomProprietes && proprietes.nomProprietes.deposerRestreintAuNoeud || "deposerRestreintAuNoeud";
	const AFFICHERNBFILS = proprietes.nomProprietes && proprietes.nomProprietes.afficherNbFils || "afficherNbFils";
	const INFOSBULLE = proprietes.nomProprietes && proprietes.nomProprietes.infosBulle || "infosBulle";

	var nbEltAffichables;
	var nbEltAffiches;
	var objDefilement;
	var listeNoeudsAffiches = new Array();
	var positionVue = 0;						// numéro du premier élément affiché parmi nbEltAffichables;
	var infoBulle;
	var optimisationNoeudADeplacer;
	var decalageTempAff = {
		delaiRafPosVue: 0,
		deportTempAff: null,
		position: null,
		indexDebut: null,
		nbElements: null,
		nomFonction: null,
		animation: null,
		actif: false,
		remplir: function (drpv, p, i, ne, nf, a) {
			this.delaiRafPosVue = drpv;
			this.position = isNaN(p) ? this.position : p;
			this.indexDebut = isNaN(i) ? this.indexDebut : i;
			this.nbElements = ne || this.nbElements;
			this.nomFonction = nf || this.nomFonction;
			this.animation = a || this.animation;
		}
	};

	function creerSourceDeDonnees(donnees) {
		sdd = donnees && donnees.constructor.name == "oxSourceDeDonnees" ? donnees : new oxSourceDeDonnees(donnees);
		sdd.abonnerEvenement("ajout", function () {
			afficherQuandPret(positionVue);
		});
		sdd.abonnerEvenement("suppression", function () {
			afficherQuandPret(positionVue);
		});
		sdd.abonnerEvenement("deplacement", function () {
			afficherQuandPret(positionVue);
		});
		sdd.abonnerEvenement("modification", function () {
			afficherQuandPret(positionVue);
		});
	}

	Element.prototype.index = function () {
		for (var index = 0 ; index < this.parentNode.children.length ; index++)
			if (this.parentNode.children[index] == this)
				return index;
		return null;
	}

	function creerListeNoeuds() {
		if (objDefilement.getHauteurContenu() == 0)																				// hauteur nulle -> inapproprié -> on sort
			return;
		nbEltAffiches = 2 * Math.floor(objDefilement.getHauteurContenu() / getHauteurElement());								// x 2 pour éviter le vide lors de l'animation lorsqu'on replie
		var nbNoeudsACreer = nbEltAffiches - listeNoeudsAffiches.length;
		if (nbNoeudsACreer > 0)
			for (var i = 0 ; i < nbNoeudsACreer ; i++) {
				var noeud = new OxNoeud({});
				noeud.getHtml().style.display = "none";
				objDefilement.getContenu().append(noeud.getHtml());
				listeNoeudsAffiches.push(noeud);
			}
		else
			listeNoeudsAffiches.splice(listeNoeudsAffiches.length + nbNoeudsACreer - 1, nbNoeudsACreer * -1);
	}

	function afficherQuandPret(position, indexDebut, nbElements, nomFonction, animation) {
		if (new Date().getTime() - decalageTempAff.delaiRafPosVue < 48)
			clearTimeout(decalageTempAff.deportTempAff);

		decalageTempAff.deportTempAff = setTimeout(function () {
			afficher(decalageTempAff.position);
		}, 50);
		decalageTempAff.remplir(new Date().getTime(), ...arguments);
	}

	function afficher(position = 0) {
		clearTimeout(decalageTempAff.deportTempAff);
		nbEltAffiches = 2 * Math.floor(objDefilement.getHauteurContenu() / getHauteurElement());								// x 2 pour éviter le vide lors de l'animation lorsqu'on replie
		positionVue = position;
		var pos = 0, compt = 0;

		function parcourirListeFils(listeNoeuds) {
			//var listeAParcourir = listeNoeuds.oxDonneesAffichees || listeNoeuds;
			var listeAParcourir = sdd.getElements(listeNoeuds && listeNoeuds[0].OxParent ? listeNoeuds[0].OxParent : null);
			for (var i = 0 ; i < listeAParcourir.length ; i++) {
				if (pos > position + nbEltAffiches)
					break;
				if (pos >= position && compt < listeNoeudsAffiches.length)
					listeNoeudsAffiches[compt++].setDonnees(listeAParcourir[i]);
				pos++;
				if (listeAParcourir[i][FILS] && listeAParcourir[i][FILS].length && listeAParcourir[i][ESTDEPLOYE])
					parcourirListeFils(listeAParcourir[i][FILS]);
			}
		}

console.time("aff");
		OxNoeud.prototype.longueur = 0;
		viderArbre();
		nbEltAffichables && parcourirListeFils(sdd.getElements(null));
		objDefilement.setLargeurContenu(OxNoeud.prototype.longueur);
		objDefilement.setPositionXContenu();
console.timeEnd("aff");

		// gestion de l'animation si besoin
		if (decalageTempAff.actif) {
			var posFinAAnimer = decalageTempAff.indexDebut + decalageTempAff.nbElements;
			posFinAAnimer = posFinAAnimer >= nbEltAffiches / 2 ? nbEltAffiches / 2 : posFinAAnimer;
			animer(decalageTempAff.indexDebut, posFinAAnimer, decalageTempAff.nomFonction, decalageTempAff.animation);
		}
		decalageTempAff.actif = false;
	}

	function animer(debut, fin, action, effet, fonctionRetour) {
		if (debut < 0)
			return;
		for (var i = debut ; i < fin ; i++) {
			if (i >= listeNoeudsAffiches.length)
				return fonctionRetour ? setTimeout(function () { fonctionRetour(); }, 200) : null;
			if (action == "afficher") {
				listeNoeudsAffiches[i].getHtml(true).hide();
				listeNoeudsAffiches[i].getHtml(true).show({ effect: effet, easing: "linear", duration: 200, complete: i == fin - 1 && fonctionRetour ? fonctionRetour : null });
			}
			else {
				listeNoeudsAffiches[i].getHtml(true).show();
				listeNoeudsAffiches[i].getHtml(true).hide({ effect: effet, easing: "linear", duration: 200, complete: i == fin - 1 && fonctionRetour ? fonctionRetour : null });
			}
		}
	}

	function viderArbre() {
		var listeNoeuds = objDefilement.getContenu().get(0).getElementsByClassName("oxNoeud");
		for (var i = 0 ; i < listeNoeuds.length ; i++)																			// optimisation -> temps divisé par 5
			listeNoeuds[i].style.display = "none";
	}

	function definirNombreElementsAffichables(listeElements, taille) {
		for (var i = 0; i < listeElements && listeElements.length; i++)
			if (listeElements[i][FILS] && listeElements[i][ESTDEPLOYE])
				taille += definirNombreElementsAffichables(listeElements[i][FILS], 0);
		return taille + (listeElements && listeElements.length || 0);
	}

	function identifierNoeudSelectionne(listeElements) {
		listeElements && listeElements.every(function (noeud) {
			if (noeudSelectionne && noeud[ESTSELECTIONNE])
				noeud[ESTSELECTIONNE] = false;
			else if (noeud[ESTSELECTIONNE])
				noeudSelectionne = noeud;
			if (noeud[FILS])
				identifierNoeudSelectionne(noeud[FILS]);
			return true;
		});
	}

	function getHauteurElement() {
		var elt = new OxNoeud({});
		$conteneur.append(elt.getHtml());
		var hauteur = $conteneur.find(".oxNoeud:last").outerHeight(true);
		$conteneur.find(".oxNoeud:last").remove();
		elt.detruire();
		return hauteur;
	}

	function getNbEltsAffichables(listeDonnees) {
		if (!listeDonnees)
			return 0;
		var nbEltsOuvert = listeDonnees.length;

		listeDonnees.forEach(function (donnees) {
			if (donnees[ESTDEPLOYE])
				nbEltsOuvert += getNbEltsAffichables(donnees[FILS]);
		});

		return nbEltsOuvert;
	}

	function initialiser() {
		creerSourceDeDonnees(proprietes.sourceDeDonnees);
		nbEltAffichables = definirNombreElementsAffichables(sdd.getElements(null), 0);
		$conteneur.addClass("ox-arbre");
		var largeurConteneur = $conteneur.width();

		$conteneur.OxDefilement({ hauteurContenu: nbEltAffichables * getHauteurElement(), largeurContenu: largeurConteneur,
			deplacementBoutonY: function (position, orgEvt) {
				if (orgEvt == "utilisateur") {
					var pos = Math.round((nbEltAffichables - nbEltAffiches / 2) * position);
			//		decalageTempAff.actif = false;
					afficher(pos);
				}
			},
			deplacementBoutonX: function (position, orgEvt) {
				if (orgEvt == "utilisateur") {
					var pos = Math.round((OxNoeud.prototype.longueur - objDefilement.getLargeurContenu()) * position);
					//$(".oxTitre").css("textIndent", pos * -1);
					$(".oxNoeud").each(function () {
                        this.style.marginLeft = this.donnees.OxNumeroParente * 20 - pos + "px";
					});
				}
			}
		});
		objDefilement = $conteneur.data("OxDefilement");

		infoBulle = new InfoBulle();

		identifierNoeudSelectionne(sdd.getElements(null));

		creerListeNoeuds();

		afficher();

		document.removeEventListener("dblclick", desactiveSelection);
		document.addEventListener("dblclick", desactiveSelection);
	}

	function estGlisserDeposable(element) {
		if (proprietes[GLISSERDEPOSER] && element[GLISSERDEPOSER] != false || element[GLISSERDEPOSER])
			return true;
		return false;
	}

	function glisserRestreintAuNoeud(element) {
		if (proprietes[GLISSERRESTREINTAUNOEUD])
			if (element.OxParent && element.OxParent[GLISSERRESTREINTAUNOEUD] == false)
				return false;
			else
				return true;
		else
			if (element.OxParent && element.OxParent[GLISSERRESTREINTAUNOEUD] == true)
				return true;
		return false;
	}

	function deposerRestreintAuNoeud(element) {
		if (proprietes[DEPOSERRESTREINTAUNOEUD])
			if (element.OxParent && element.OxParent[DEPOSERRESTREINTAUNOEUD] == false)
				return false;
			else
				return true;
		else
			if (element.OxParent && element.OxParent[DEPOSERRESTREINTAUNOEUD] == true)
				return true;
		return false;
	}

	function desactiveSelection() {										// empêche la sélection de l'arbre
		setTimeout(function () {
			if (window.getSelection().containsNode($(".oxTitre").get(0), true))
				window.getSelection().removeAllRanges();
		}, 100);
	}

	function cadrerAffichage (donneesNoeudParent, nbElements) {
		var positionDernierElement = instance.getIndexParmiEltsAffiches(donneesNoeudParent) + nbElements;
		var positionDernierElementAffichable = nbEltAffiches / 2;
		if (positionDernierElement >= positionDernierElementAffichable)
			if (nbElements > nbEltAffiches / 2) {
				positionVue = instance.getIndexDansArborescence(donneesNoeudParent);						// on affiche le parent en début d'affichage
				decalageTempAff.indexDebut = 1;
			}
			else {																							// sinon le dernier fils en fin d'affichage
				positionVue += positionDernierElement - positionDernierElementAffichable + 1;				// +1 pour que le dernier elt ne soit pas tronqué
				decalageTempAff.indexDebut -= positionDernierElement - positionDernierElementAffichable + 1;
			}
		objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		objDefilement.setPositionYContenu(positionVue / ((nbEltAffichables - nbEltAffiches / 2) || 1));
	}

	function reajustementApresFiltrage(donneesNoeud, differenceNbElements) {
		if (differenceNbElements) {
			nbEltAffichables += differenceNbElements;
			objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
			objDefilement.setPositionYContenu(positionVue ? positionVue / (nbEltAffichables - Math.round(nbEltAffiches / 2)) : 0);
			if (typeof proprietes.filtre == "function")
				proprietes.filtre(donneesNoeud, texte);
		}
	}

	this.getConteneur = function () {
		return $conteneur;
	}

	this.getIndex = function (donneesNoeud) {
		return sdd.getIndex(donneesNoeud);
	}

	this.getSourceDeDonnees = function () {
		return sdd.getElements();
	}

	this.getIndexDansArborescence = function (donneesNoeud) {
		var nbEltAffiches = 2 * Math.floor(objDefilement.getHauteurContenu() / getHauteurElement());
		var pos = 0, compt = 0;

		function parcourirListeFils(listeNoeuds) {
            var listeAParcourir = sdd.getElements(listeNoeuds && listeNoeuds[0].OxParent ? listeNoeuds[0].OxParent : null);
			//var listeAParcourir = listeNoeuds.oxDonneesAffichees ? listeNoeuds.action[listeNoeuds.oxDonneesAffichees].donnees : listeNoeuds;
			for (var i = 0 ; i < listeAParcourir.length ; i++) {
				if (listeAParcourir[i] == donneesNoeud)
					return pos; //return compt;
				// if (pos > positionVue + nbEltAffiches)
				// 	break;
				// if (pos >= positionVue && compt < listeNoeudsAffiches.length)
				// 	compt++;
				pos++;
				if (listeAParcourir[i][FILS] && listeAParcourir[i][ESTDEPLOYE]){
					var resultat = parcourirListeFils(listeAParcourir[i][FILS]);
					if (resultat)
						return resultat;
				}
			}
		}

		if (nbEltAffichables)
			return parcourirListeFils(sdd.getElements());
		return -1;					// non trouvé
	}

	this.getIndexParmiEltsAffiches = function (donneesNoeud) {
		return instance.getIndexDansArborescence(donneesNoeud) - positionVue;
	}

	this.getPositionVue = function () {
		return positionVue;
	}

	/*
	 *	retourne le premier noeud trouvé conrrespondant au critère souhaité
	 */
	this.getNoeudSuivantParametre = function (parametre, valeur) {
		function parcourir (parent) {
			var noeudRecherche = null;
			parent.every(function(noeud) {
				if (noeud[parametre] == valeur)
					noeudRecherche = noeud;
				else if (noeud[FILS])
					noeudRecherche = parcourir(noeud[FILS]);
				if (noeudRecherche)
					return false;
				return true;
			});
			return noeudRecherche;
		}
		return parcourir(sdd.getElements());
	}

	this.getSelection = function () {
		return noeudSelectionne;
	}

	this.getNoeudsCoches = function () {
		return noeudsCoches;
	}

	this.estSelectionnable = function (donneesNoeud) {
		return donneesNoeud[ESTSELECTIONNABLE];
	}

	/*
	 * 0 -> pas de sélection
	 * 1 -> sélection dans le parent
	 * 2 -> sélection indépendante de la hiérarchie
	 * 3 -> sélection exclusive
	 */
	this.getModeDeMultSelection = function (donnees) {
		if (donnees && donnees[MULTISELECTION] != undefined)
			return donnees[MULTISELECTION];
		else
			return proprietes[MULTISELECTION] || 0;
	}

	this.selectionner = function(donneesNoeud) {
		if (donneesNoeud[ESTSELECTIONNABLE] == false || noeudSelectionne == donneesNoeud)
			return;
		var ancierNoeudSelectionne = noeudSelectionne;
		noeudSelectionne && (noeudSelectionne[ESTSELECTIONNE] = false);
		donneesNoeud[ESTSELECTIONNE] = true;
		noeudSelectionne = donneesNoeud;
		afficher(positionVue);
		var org;
		if (typeof proprietes.selection == "function")
			proprietes.selection(donneesNoeud, ancierNoeudSelectionne, (org = arguments.callee.caller) && org.name == "evtSelection" ? "utilisateur" : "systeme");
	}

	this.cocher = function(donneesNoeud, etat, origine = "systeme") {
		if (instance.getModeDeMultSelection(donneesNoeud) == 0)										// pas de multisélection
			return;

		function cocherFils (noeud) {
			var indexObj = noeudsCoches.indexOf(noeud);
			!~indexObj && etat == OxCaseACocher.prototype.etats.COCHE && noeudsCoches.push(noeud);
			~indexObj && etat == OxCaseACocher.prototype.etats.DECOCHE && noeudsCoches.splice(indexObj, 1);
			instance.getModeDeMultSelection(noeud) && (noeud[ESTCOCHE] = etat);
			instance.getModeDeMultSelection(noeud) == OxArbre.prototype.multiselection.LIMITEAUPARENT && noeud[FILS] && noeud[FILS].forEach(function (noeud) {
				cocherFils(noeud);
			});
			instance.getModeDeMultSelection(noeud) == OxArbre.prototype.multiselection.EXCLUSIFAUPARENT && noeud.OxParent[FILS].forEach(function (frere) {
				noeud != frere && frere[ESTCOCHE] && noeudsCoches.splice(noeudsCoches.indexOf(frere), 1);
				noeud != frere && delete frere[ESTCOCHE];
			});
		}

		function cocherParents (noeud) {
			if (instance.getModeDeMultSelection(noeud) == OxArbre.prototype.multiselection.NONLIMITE)
				return;
			var parent = noeud.OxParent;
			var nbEltCoche = 0;
			var nbEltIndetermine = 0;
			parent && parent[FILS].every(function (n, i) {
				switch(n[ESTCOCHE]) {
					case OxCaseACocher.prototype.etats.COCHE:
						nbEltCoche++;
						break;
					case OxCaseACocher.prototype.etats.INDETERMINE:
						nbEltIndetermine++;
						return false;
					default:
						if (nbEltCoche > 0)
							return false;
				}
				return true;
			});
			if (parent && nbEltCoche == parent[FILS].length)
				parent[ESTCOCHE] = OxCaseACocher.prototype.etats.COCHE;
			else if (parent && (nbEltCoche > 0 || nbEltIndetermine > 0))
				parent[ESTCOCHE] = OxCaseACocher.prototype.etats.INDETERMINE;
			else if (parent)
				parent[ESTCOCHE] = OxCaseACocher.prototype.etats.DECOCHE;
			parent && cocherParents(parent);
		}

		cocherFils(donneesNoeud);
		cocherParents(donneesNoeud);
		afficher(positionVue);
		if (typeof proprietes.elementsCoches == "function")
			proprietes.elementsCoches(donneesNoeud, origine);
	}

	this.ouvrirNoeud = function(donneesNoeud, index = -1, nomFonctionAppelante) {
		if (typeof proprietes.avantOuvertureNoeud == "function")
			if (proprietes.avantOuvertureNoeud(donneesNoeud, nomFonctionAppelante == "evtClickEtendeur" ? "utilisateur" : "systeme") == false)
				return;
		if (donneesNoeud[ESTDEPLOYE])
			return;
		donneesNoeud[ESTDEPLOYE] = true;
		var nbEltsAAfficher = getNbEltsAffichables(donneesNoeud[FILS]);
		nbEltAffichables = donneesNoeud[ESTDEPLOYE] ? nbEltAffichables + nbEltsAAfficher : nbEltAffichables - nbEltsAAfficher;
		donneesNoeud.oxNoeudAAnimer = true;
		/*afficher(positionVue);
		var posFinAAnimer = index + nbEltsAAfficher;
		posFinAAnimer = posFinAAnimer >= nbEltAffiches / 2 ? nbEltAffiches / 2 : posFinAAnimer;
		index != -1 && animer(index, posFinAAnimer, "afficher", proprietes.nomAnimation);*/
        nbEltsAAfficher && (decalageTempAff.actif = true);
		afficherQuandPret(positionVue, index, nbEltsAAfficher, "afficher", proprietes.nomAnimation);
		cadrerAffichage(donneesNoeud, nbEltsAAfficher);
		delete donneesNoeud.oxNoeudAAnimer;
		objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		if (typeof proprietes.ouvertureNoeud == "function")
			proprietes.ouvertureNoeud(donneesNoeud, nomFonctionAppelante == "evtClickEtendeur" ? "utilisateur" : "systeme");
	}

	this.fermerNoeud = function(donneesNoeud, index = -1, nomFonctionAppelante) {
		if (typeof proprietes.avantFermetureNoeud == "function")
			if (proprietes.avantFermetureNoeud(donneesNoeud, nomFonctionAppelante == "evtClickEtendeur" ? "utilisateur" : "systeme") == false)
				return;
		var diff = sdd.reinitialiserSubsomption();
		reajustementApresFiltrage(donneesNoeud, diff);
		donneesNoeud[ESTDEPLOYE] = false;
		var nbEltsAMasquer = getNbEltsAffichables(donneesNoeud[FILS]);
		nbEltAffichables = donneesNoeud[ESTDEPLOYE] ? nbEltAffichables + nbEltsAMasquer : nbEltAffichables - nbEltsAMasquer;
		var posFinAAnimer = index + nbEltsAMasquer;
	//	posFinAAnimer = posFinAAnimer >= nbEltAffiches / 2 ? nbEltAffiches / 2 : posFinAAnimer;
		donneesNoeud.oxNoeudAAnimer = true;
		if (donneesNoeud[FILS].length > 0 && index != -1)
			animer(index, posFinAAnimer, "masquer", proprietes.nomAnimation, function () {
			//	decalageTempAff.actif = false;
				if (positionVue + nbEltAffiches / 2 > nbEltAffichables) {
					positionVue = nbEltAffichables - nbEltAffiches / 2;
					positionVue = positionVue < 0 ? 0 : positionVue;
				}
				afficher(positionVue);
				delete donneesNoeud.oxNoeudAAnimer;
			});
		else {
            nbEltsAMasquer && (decalageTempAff.actif = true);
			afficher(positionVue);
			delete donneesNoeud.oxNoeudAAnimer;
		}
		objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		if (typeof proprietes.fermetureNoeud == "function")
			proprietes.fermetureNoeud(donneesNoeud, nomFonctionAppelante == "evtClickEtendeur" ? "utilisateur" : "systeme");
	}

	this.redimentionner = function (hauteur, largeur) {
		hauteur && $conteneur.height(hauteur);
		largeur && $conteneur.width(largeur);

		hauteur && objDefilement.setHauteurConteneur(hauteur);
		largeur && objDefilement.setLargeurConteneur(largeur);

		creerListeNoeuds();
	}

	this.positionnerVue = function (donneesNoeud) {
	/*	setTimeout(function () {
			if (new Date().getTime() - delaiRafPosVue > 48)
				positionnerVue(donneesNoeud);
		}, 50);
		delaiRafPosVue = new Date().getTime();
	}

	function positionnerVue (donneesNoeud) {*/
		nbEltAffiches = 2 * Math.floor(objDefilement.getHauteurContenu() / getHauteurElement());								// x 2 pour éviter le vide lors de l'animation lorsqu'on replie
		var nbEltsPrecedents = Math.round(nbEltAffiches / 4);
		var parent = donneesNoeud.OxParent;
		var listeNoeuds = parent ? parent[FILS] : sdd.getElements();
		var index = sdd.getIndex(donneesNoeud);
		var listeNoeudsPrecedents = new Array(nbEltsPrecedents);
		var pos = nbEltsPrecedents - 1;
		function parcourir (listeNoeuds, index) {
			for (var i = (!isNaN(index) ? index : listeNoeuds.length - 1) ; i >= 0 ; i--)
				if (listeNoeuds[i][ESTDEPLOYE])
					parcourir(listeNoeuds[i][FILS]);
				else if (pos >= 0)
					listeNoeudsPrecedents[pos--] = listeNoeuds[i];
			if (!listeNoeuds[0].OxParent)
				return;
			listeNoeudsPrecedents[pos--] = listeNoeuds[0].OxParent;
			var listeParents = listeNoeuds[0].OxParent.OxParent ? listeNoeuds[0].OxParent.OxParent[FILS] : sdd.getElements();
			if (pos >= 0)
				parcourir(listeParents, sdd.getIndex(listeNoeuds[0].OxParent) - 1);
		}
		parcourir(listeNoeuds, index - 1);

		viderArbre();
		var premierNoeud = listeNoeudsPrecedents[0];
		for (var compt = 0 ; compt < listeNoeudsPrecedents.length ; compt++)
			listeNoeudsPrecedents[compt] && listeNoeudsAffiches[compt].setDonnees(listeNoeudsPrecedents[compt]);

		var pos = 0;
		positionVue = null;
		function parcourirListeFils (listeNoeuds) {
			var listeAParcourir = /*listeNoeuds.oxDonneesAffichees ? listeNoeuds.action[listeNoeuds.oxDonneesAffichees].donnees : */listeNoeuds;
			for (var i = 0 ; i < listeAParcourir.length ; i++) {
				if (premierNoeud == listeAParcourir[i])
					positionVue = pos;
				if (positionVue != null && pos > positionVue + nbEltAffiches || compt >= listeNoeudsAffiches.length)
					break;
				if (positionVue != null && pos >= positionVue + compt)
					listeNoeudsAffiches[compt++].setDonnees(listeAParcourir[i]);
				pos++;
				if (listeAParcourir[i][FILS] && listeAParcourir[i][ESTDEPLOYE])
					parcourirListeFils(listeAParcourir[i][FILS]);
			}
		}
		parcourirListeFils(sdd.getElements());
		objDefilement.setPositionYContenu(positionVue / ((nbEltAffichables - nbEltAffiches / 2) || 1));
		objDefilement.setPositionXContenu();
	}

	this.ajouter = function (donneesNoeud, donneesNoeudParent, indexDestination) {
		if (noeudSelectionne)
			donneesNoeud[ESTSELECTIONNE] = false;
		else if (donneesNoeud[ESTSELECTIONNE])
			noeudSelectionne = donneesNoeud;
		sdd.ajouterElement(donneesNoeud, donneesNoeudParent, indexDestination);
		//cadrerAffichage(donneesNoeudParent, 1);

		if (!donneesNoeudParent || donneesNoeudParent && donneesNoeudParent[ESTDEPLOYE]) {
			nbEltAffichables++;
			var nbEltsAAfficher = getNbEltsAffichables(donneesNoeud[FILS]);
			nbEltAffichables += nbEltsAAfficher;
			objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		}
		//decalageTempAff.remplir(new Date().getTime(), positionVue, instance.getIndexDansArborescence(donneesNoeudParent) + 1, 1);
		//afficherQuandPret(positionVue);																								// on ne gère pas l'affichage dans cette fonction
		if (typeof proprietes.ajoutNoeud == "function")
			proprietes.ajoutNoeud(donneesNoeud);
	}

	this.ajouterMultiple = function (listeNoeuds, donneesNoeudParent, indexDestination) {
		if (noeudSelectionne)
			for (var i = 0 ; i < listeNoeuds.length ; i++)
				listeNoeuds[i][ESTSELECTIONNE] = false;
		else
			for (var i = 0 ; i < listeNoeuds.length ; i++)
				if (listeNoeuds[i][ESTSELECTIONNE]) {
					noeudSelectionne = listeNoeuds[i];
					i = listeNoeuds.length;
				}
		sdd.ajouterElements(listeNoeuds, donneesNoeudParent, indexDestination);
		//cadrerAffichage(donneesNoeudParent, listeNoeuds.length);

		if (!donneesNoeudParent || donneesNoeudParent && donneesNoeudParent[ESTDEPLOYE]) {
			nbEltAffichables += listeNoeuds.length;
			for (var i = 0 ; i < listeNoeuds.length ; i++)
				nbEltAffichables += getNbEltsAffichables(listeNoeuds[i][FILS]);
			objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		}
		//decalageTempAff.remplir(new Date().getTime(), positionVue, instance.getIndexDansArborescence(donneesNoeudParent) + 1, listeNoeuds.length);
		//afficherQuandPret(positionVue);

		if (typeof proprietes.ajoutNoeud == "function")
			proprietes.ajoutNoeud(donneesNoeud);
	}

	this.supprimer = function (donneesNoeud) {
		if (noeudSelectionne == donneesNoeud) {
			noeudSelectionne[ESTSELECTIONNE] = false;
			noeudSelectionne = null;
		}
		var indexElt = sdd.supprimerElement(donneesNoeud);
		if (indexElt < 0)
			return;
		nbEltAffichables--;
		if (donneesNoeud[ESTDEPLOYE]) {
			var nbEltsAAfficher = getNbEltsAffichables(donneesNoeud[FILS]);
			nbEltAffichables -= nbEltsAAfficher;
		}
		objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		afficherQuandPret(positionVue);
	//	decalageTempAff.actif = false;

		if (typeof proprietes.supprimerNoeud == "function")
			proprietes.supprimerNoeud(donneesNoeud);
	}

	this.supprimerFils = function (donneesNoeud) {
		(function nettoyerNoeudSelectionne (listeElts) {
			listeElts = Array.isArray(listeElts) ? listeElts : [listeElts];
			for (var i = 0 ; noeudSelectionne && i < listeElts.length ; i++) {
				if (listeElts[i] == noeudSelectionne) {
					noeudSelectionne[ESTSELECTIONNE] = false;
					noeudSelectionne = null;
				}
				listeElts[i].OxFils && listeElts[i].OxFils.length && nettoyerNoeudSelectionne(listeElts[i].OxFils);
			}
		})(donneesNoeud ? donneesNoeud.OxFils : sdd.getElements());

		var nbFilsSupprimes = sdd.supprimerFils(donneesNoeud);
		if (!donneesNoeud || donneesNoeud[ESTDEPLOYE])
			nbEltAffichables -= nbFilsSupprimes;
		objDefilement.setHauteurContenu(nbEltAffichables * getHauteurElement());
		afficherQuandPret(positionVue);
		if (typeof proprietes.supprimerNoeud == "function")
			proprietes.supprimerNoeud(donneesNoeud);
	}

	this.modifier = function (donneesNoeud, nouvellesValeurs) {
		sdd.modifierElement(donneesNoeud, nouvellesValeurs);
	}

	this.deplacer = function (donneesNoeud, parent, indexDestination) {
		var indexOrigine = sdd.getIndex(donneesNoeud);
		var indexElt = sdd.deplacerElement(donneesNoeud, parent, indexDestination);
		afficher(positionVue);
		if (typeof proprietes.deplacement == "function")
			proprietes.deplacement(donneesNoeud, indexOrigine);
	}

	this.changerStyleEtendeur = function (donneesNoeud, nouveauStyle) {
		donneesNoeud[STYLEETENDEUR] = nouveauStyle;
		afficher(positionVue);
	}

	this.changerStyleIcone = function (donneesNoeud, nouveauStyle) {
		donneesNoeud[STYLEICONE] = nouveauStyle;
		afficher(positionVue);
	}

	this.changerStyleTitre = function (donneesNoeud, nouveauStyle) {
		donneesNoeud[STYLETITRE] = nouveauStyle;
		afficher(positionVue);
	}

	this.definirClassesNoeud = function (donneesNoeud, classes) {
		donneesNoeud[CLASSE] = classes;
		afficher(positionVue);
	}

	this.changerTitre = function (donneesNoeud, titre) {
		donneesNoeud[TITRE] = titre;
		afficher(positionVue);
	}

	this.definirSelectionnable = function (donneesNoeud, estSelectionnable) {
		donneesNoeud[ESTSELECTIONNABLE] = estSelectionnable;
		if (noeudSelectionne == donneesNoeud) {
			noeudSelectionne[ESTSELECTIONNE] = false;
			noeudSelectionne = null;
		}
		donneesNoeud[ESTSELECTIONNE] = false;
		afficher(positionVue);
	}

	this.definirMultiselection = function (donneesNoeud, niveauMultiselection) {
		var obj = donneesNoeud || proprietes;
		obj[MULTISELECTION] = niveauMultiselection;
		afficher(positionVue);
	}

	this.definirGlisserDepossable = function (donneesNoeud, parametre, valeur) {
		var obj = donneesNoeud || proprietes;
		obj[parametre] = valeur;
		afficher(positionVue);
	}

	/*
	 *	passer un texte vide pour supprimer le filtre
	 */
	this.filtrer = function (donneesNoeud, texte) {
		if (texte)
			var diff = sdd.filtrer(donneesNoeud, TITRE, texte);
		else
			var diff = sdd.reinitialiserSubsomption();
		console.log("diff :", diff)
		reajustementApresFiltrage(donneesNoeud, diff);
	}

	this.detruire = function () {
		listeNoeudsAffiches.forEach(function(noeud) {
			noeud.detruire();
		});
		$conteneur.remove();
		document.removeEventListener("dblclick", desactiveSelection);
	}

	function OxNoeud (donnees) {
		var objNoeud = this;

		var noeud = document.createElement("div");
        noeud.donnees = donnees;
		noeud.className = "oxNoeud";
		var etendeur = document.createElement("div");
		etendeur.className = "ox-etendeur";
		var caseACocher = document.createElement("input");
		caseACocher.className = "oxCaseACocher";
		caseACocher.type = "checkbox";
		var img = document.createElement("img");
		img.className = "oxImg";
		var svg = document.createElement("div");
		svg.className = "oxSvg";
		var titre = document.createElement("span");
		titre.className = "oxTitre";
		/*var nbFils = document.createElement("div");
		nbFils.className = "oxNbFils";*/
		var infoEvt = document.createElement("div");
		infoEvt.className = "oxEvt";
		noeud.appendChild(etendeur);
		noeud.appendChild(caseACocher);
		noeud.appendChild(img);
		noeud.appendChild(svg);
		//noeud.appendChild(nbFils);
		noeud.appendChild(infoEvt);
		noeud.appendChild(titre);
		$(caseACocher).OxCaseACocher({
			theme: 2,
			coche: function (e, etat, origine) {
				instance.cocher(donnees, etat, origine);
			},
			decoche: function (e, etat, origine) {
				instance.cocher(donnees, etat, origine);
			}
		});
		var objCC = $(caseACocher).data('OxCaseACocher');

		function appliquerParametres (){
			noeud.className = "oxNoeud";
			donnees[CLASSE] && (noeud.className += ' ' + donnees[CLASSE]);
			//noeud.className = noeud.className.replace(/ ?ox-estSelectionne/g, '');
			donnees[ESTSELECTIONNE] && (noeud.className += " ox-estSelectionne");
			noeud.style.display = "block";
			noeud.style.marginLeft = donnees.OxNumeroParente * 20 + "px";
			donnees[STYLEETENDEUR] && (etendeur.style = donnees[STYLEETENDEUR]);
			etendeur.className = etendeur.className.replace(/ ?ox-estAffiche/g, '');
			etendeur.style.visibility = donnees[FILS] && Array.isArray(donnees[FILS]) ? "visible" : "hidden";
			donnees[FILS] && Array.isArray(donnees[FILS]) && (etendeur.className += " ox-estAffiche");
			//noeud.className = noeud.className.replace(/ ?ox-deploye/g, '');
			donnees[ESTDEPLOYE] && (noeud.className += " ox-deploye");
			noeud.draggable = false;
			/*noeud.className = noeud.className.replace(/ ?ox-estGlisserDeposable/g, '');
			noeud.className = noeud.className.replace(/ ?ox-glisserRestreintAuNoeud/g, '');
			noeud.className = noeud.className.replace(/ ?ox-deposerRestreintAuNoeud/g, '');
			noeud.className = noeud.className.replace(/ ?ox-multiSelectionnable-\d?/g, '');
			noeud.className = noeud.className.replace(/ ?ox-nonSelectionnnable/g, '');
			noeud.className = noeud.className.replace(/ ?ox-animation/g, '');*/
			donnees.oxNoeudAAnimer && (noeud.className += " ox-animation");
			donnees[ESTSELECTIONNABLE] == false && (noeud.className += " ox-nonSelectionnnable");
			if (estGlisserDeposable(donnees)) {
				noeud.draggable = true;
				noeud.className += " ox-estGlisserDeposable";
				if (glisserRestreintAuNoeud(donnees))
					noeud.className += " ox-glisserRestreintAuNoeud";
				if (deposerRestreintAuNoeud(donnees))
					noeud.className += " ox-deposerRestreintAuNoeud";
			}
			/*nbFils.innerHTML = '';
			nbFils.style.display = "none";
			nbFils.className = "oxNbFils";
			if ((proprietes[AFFICHERNBFILS] || donnees[AFFICHERNBFILS]) && donnees[FILS] && donnees[FILS].length) {
				nbFils.innerHTML = donnees[FILS].length;
				nbFils.style.display = "block";
				nbFils.className += " taille" + (donnees[FILS].length + '').length;
			}*/
			infoEvt.innerHTML = '!';
			infoEvt.style.display = "none";
			infoEvt.className = "oxInfoEvt";
			var longueurNoeud = donnees[FILS] && Array.isArray(donnees[FILS]) ? 20 : 0;
			if (sdd.estDonneesFiltrees(donnees[FILS])/*donnees[FILS] && donnees[FILS].oxDonneesAffichees*/)
				infoEvt.style.display = "block";
			if (instance.getModeDeMultSelection(donnees)){
				objCC.afficher();
				objCC.modifierEtat(donnees[ESTCOCHE] || 0, false);
				longueurNoeud += 20;
				noeud.className += " ox-multiSelectionnable-" + instance.getModeDeMultSelection(donnees);
				if (instance.getModeDeMultSelection(donnees) == OxArbre.prototype.multiselection.EXCLUSIFAUPARENT) {
					objCC.changerNom(donnees.OxParent.titre);
					objCC.changerMode(OxCaseACocher.prototype.mode.RADIO);
				}
				else
					objCC.changerMode(OxCaseACocher.prototype.mode.CASEACOCHER);
			}
			else
				objCC.masquer();
			img.style.display = "none";
			img.src = '';
			svg.style.display = "none";
			svg.className = "oxSvg";
			if (donnees[IMAGE]) {
				donnees[STYLEICONE] && (img.style = donnees[STYLEICONE]);
				img.style.display = "block";
				img.src = donnees[IMAGE];
				donnees[CLASSEICONE] && (img.className += ' ' + donnees[CLASSEICONE]);
				longueurNoeud += 20;
			}
			else if (donnees[SVG]) {
				donnees[STYLEICONE] && (svg.style = donnees[STYLEICONE]);
				svg.style.display = "block";
				svg.className += ' ' + donnees[SVG];
				donnees[CLASSEICONE] && (svg.className += ' ' + donnees[CLASSEICONE]);
				longueurNoeud += 20;
			}
			donnees[STYLETITRE] && (titre.style = donnees[STYLETITRE]);
			titre.innerHTML = donnees[TITRE] || '';
			donnees[CLASSETEXTE] && (titre.className += ' ' + donnees[CLASSETEXTE]);

			longueurNoeud += donnees.OxNumeroParente * 20 + donnees[TITRE].length * 7.6;
			if (OxNoeud.prototype.longueur < longueurNoeud) {
				OxNoeud.prototype.longueur = longueurNoeud;
				//OxNoeud.prototype.getLongueur = function () { return $titre.get(0).offsetWidth; };						// lent
			}
		}

		this.detruire = function () {
			noeud.removeEventListener("dragstart", dragstart, false);
			noeud.removeEventListener("dragover", dragover, false);
			noeud.removeEventListener("dragend", drop, false);
			noeud.removeEventListener("click", evtSelection, false);
			noeud.removeEventListener("dblclick", evtDoubleClick, false);
			noeud.removeEventListener("contextmenu", evtCliqueDroit, false);
			titre.removeEventListener("mouseover", titreSurvole, false);
			titre.removeEventListener("mousemove", titreSourisDeplacee, false);
			titre.removeEventListener("mouseout", titreSourisSort, false);
			etendeur.removeEventListener("click", evtClickEtendeur, false);
			noeud.remove();
		}

		this.getHtml = function(format) {
			if (format)
				return $(noeud);
			return noeud;
		}

		this.getDonnees = function(d) {
			return donnees;
		}

		this.setDonnees = function(d) {
			donnees = d;
			noeud.donnees = d;
			appliquerParametres();
		}

		function dragstart (e) {
			if (!estGlisserDeposable(donnees))
				return;
			if (proprietes && typeof proprietes.demarrageGlissage == "function" && proprietes.demarrageGlissage(donnees) == false)
				return;
			e.dataTransfer.setData('text/plain', '');															// Nécessaire pour Firefox
			transfertNoeud.noeudEnCoursDeDeplacement = objNoeud;
			transfertNoeud.objArbreDepart = instance;
		}
		function dragover (e) {
			if (!estGlisserDeposable(donnees))
				return;
			e.preventDefault();																					// Annule l'interdiction de drop
			transfertNoeud.objArbreArrive = instance;
			var posSourisParRapportAuMilieuDeLelement = $(this).offset().top + $(this).outerHeight(true) / 2 - e.pageY;
			transfertNoeud.noeudDeFinDeDeplacement = objNoeud || transfertNoeud.noeudDeFinDeDeplacement;					// à cause du noeud temporaire
			transfertNoeud.indexNouvellePosition = sdd.getIndex(objNoeud.getDonnees()) + (posSourisParRapportAuMilieuDeLelement > 0 ? 0 : 1);

			if ($(this).hasClass("noeudTemporaire") || optimisationNoeudADeplacer == this)								// si pas de changement on sort
				return;

			optimisationNoeudADeplacer = this;
			OxNoeud.prototype.noeudTemporaire.remove();
			console.log(sdd.getIndex(objNoeud.getDonnees()), transfertNoeud.indexNouvellePosition, posSourisParRapportAuMilieuDeLelement)
			if (transfertNoeud.noeudEnCoursDeDeplacement.getDonnees().OxParent == transfertNoeud.noeudDeFinDeDeplacement.getDonnees().OxParent ||
					!glisserRestreintAuNoeud(transfertNoeud.noeudEnCoursDeDeplacement.getDonnees()) &&
					!deposerRestreintAuNoeud(transfertNoeud.noeudDeFinDeDeplacement.getDonnees()))
				if (posSourisParRapportAuMilieuDeLelement > 0)
					$(this).before(OxNoeud.prototype.noeudTemporaire);
				else
					$(this).after(OxNoeud.prototype.noeudTemporaire);
				transfertNoeud.position = posSourisParRapportAuMilieuDeLelement > 0 ? "avant" : "apres";
		}
		function drop (e) {
			OxNoeud.prototype.noeudTemporaire.remove();
			var noeudCD = transfertNoeud.noeudEnCoursDeDeplacement;
			var noeudFD = transfertNoeud.noeudDeFinDeDeplacement;
			if (!noeudFD)												// si clique trop rapide -> bug
				return;
			var donnnesEnCoursDeplacement = noeudCD && noeudCD.getDonnees();
			var donneesDeFinDeDeplacement = noeudFD && noeudFD.getDonnees();
			if (proprietes && typeof proprietes.avantNoeudDepose == "function")
				if (proprietes.avantNoeudDepose(donnnesEnCoursDeplacement, donneesDeFinDeDeplacement, transfertNoeud.position) == false)
					return;
			var noeudsTemporaireDepart = noeudCD.getHtml().parentNode.getElementsByClassName("noeudTemporaire");
			var noeudsTemporaireArrive = noeudFD.getHtml().parentNode.getElementsByClassName("noeudTemporaire");
			noeudsTemporaireDepart.length && noeudsTemporaireDepart[0].remove();
			noeudsTemporaireArrive.length && noeudsTemporaireArrive[0].remove();
			if (!donnnesEnCoursDeplacement || !donneesDeFinDeDeplacement ||
				!estGlisserDeposable(donneesDeFinDeDeplacement) ||
				proprietes && typeof proprietes.avantDepose == "function" && proprietes.avantDepose(donnnesEnCoursDeplacement, donneesDeFinDeDeplacement) == false)
				return;
			if (donneesDeFinDeDeplacement.OxParent == donnnesEnCoursDeplacement.OxParent && transfertNoeud.objArbreDepart == transfertNoeud.objArbreArrive)
				instance.deplacer(donnnesEnCoursDeplacement, transfertNoeud.indexNouvellePosition);
			else if (!glisserRestreintAuNoeud(donnnesEnCoursDeplacement) && !deposerRestreintAuNoeud(donneesDeFinDeDeplacement)) {
				var parent = donneesDeFinDeDeplacement.OxParent;

				function modifierNumeroParente (donneesNoeud, numero) {
					donneesNoeud.OxNumeroParente = numero;
					donneesNoeud[FILS] && donneesNoeud[FILS].forEach(function(fils) {
						modifierNumeroParente(fils, numero + 1);
					});
				}
				modifierNumeroParente(donnnesEnCoursDeplacement, parent ? parent.OxNumeroParente + 1 : 1);

				transfertNoeud.objArbreDepart.supprimer(donnnesEnCoursDeplacement);
				transfertNoeud.objArbreArrive.ajouter(donnnesEnCoursDeplacement, parent, transfertNoeud.indexNouvellePosition);
			}
			if (proprietes && typeof proprietes.noeudDepose == "function")
				proprietes.noeudDepose(donnnesEnCoursDeplacement, donneesDeFinDeDeplacement, transfertNoeud.position);
		}
		if (!OxNoeud.prototype.noeudTemporaire) {																// on cré un noeud temporaire pour gérer le déplacement
			OxNoeud.prototype.noeudTemporaire = document.createElement("div");
			OxNoeud.prototype.noeudTemporaire.className = "oxNoeud noeudTemporaire";
			OxNoeud.prototype.noeudTemporaire.addEventListener('dragover', function(e) {
				e.preventDefault();																				// Annule l'interdiction de drop
			});
			OxNoeud.prototype.noeudTemporaire.addEventListener("dragend", drop);
		}

		function titreSurvole (e) {
			var texte = donnees[INFOSBULLE] || donnees[TITRE] + (proprietes[AFFICHERNBFILS] || donnees[AFFICHERNBFILS] ? " (" + (donnees[FILS] && donnees[FILS].length ? donnees[FILS].length : 0) + ')' : '');
			infoBulle.setTexte(texte);
			proprietes && typeof proprietes.titreSurvole == "function" && proprietes.titreSurvole(e, donnees);
		}
		function titreSourisDeplacee(e) {
			infoBulle.positionner(e.clientY, e.clientX);
		}
		function titreSourisSort (e) {
			infoBulle.masquer();
		}
		function evtSelection (e) {
			instance.selectionner(donnees);
			if (typeof proprietes.elementClique == "function")
				proprietes.elementClique(donnees, e);
		}
		function evtDoubleClick (e) {
			if (typeof proprietes.elementDoubleClique == "function")
				proprietes.elementDoubleClique(donnees, e);
		}
		function evtCliqueDroit (e) {
			if (typeof proprietes.elementCliqueDroit == "function")
				proprietes.elementCliqueDroit(donnees, e);
		}
		function evtClickEtendeur (e) {
			e.stopPropagation();
			if (donnees[ESTDEPLOYE])						// on repli
				instance.fermerNoeud(donnees, noeud.index() + 1, "evtClickEtendeur");
			else
				instance.ouvrirNoeud(donnees, noeud.index() + 1, "evtClickEtendeur");
		}

		noeud.addEventListener('dragstart', dragstart);
		noeud.addEventListener('dragover', dragover);
		noeud.addEventListener("dragend", drop);

		titre.addEventListener("mouseover", titreSurvole);
		titre.addEventListener("mousemove", titreSourisDeplacee);
		titre.addEventListener("mouseout", titreSourisSort);

		noeud.addEventListener("click", evtSelection);
		noeud.addEventListener("dblclick", evtDoubleClick);
		noeud.addEventListener("contextmenu", evtCliqueDroit);

		etendeur.addEventListener("click", evtClickEtendeur);
	}

	function InfoBulle (texte){
		var $conteneur = $("<div class = 'infoBulle'></div>");
		instance.getConteneur().append($conteneur);
		var delaiApparition;
		var delaiDisparition;

		this.setTexte = function (texte) {
			clearTimeout(delaiDisparition);
			$conteneur.html(texte);
			delaiApparition = setTimeout(function(){
				afficher();
			}, 500);
		}

		this.positionner = function (haut, gauche) {
			$conteneur.get(0).style.top = haut + 15 + "px";
			$conteneur.get(0).style.left = gauche + 15 + "px";
		}

		function afficher () {
			$conteneur.get(0).style.display = "block";
		}

		this.masquer = function () {
			clearTimeout(delaiApparition);
			delaiDisparition = setTimeout(function(){
				$conteneur.get(0).style.display = "none";
			}, 100);
		}
	}

	initialiser();
}

var transfertNoeud = {
	noeudEnCoursDeDeplacement: null,
	noeudDeFinDeDeplacement: null,
	indexNouvellePosition: null,
	objArbreDepart: null,
	objArbreArrive: null,
	position: "avant"
}

OxArbre.prototype.multiselection = {};
OxArbre.prototype.multiselection.LIMITEAUPARENT = 1;
OxArbre.prototype.multiselection.NONLIMITE = 2;
OxArbre.prototype.multiselection.EXCLUSIFAUPARENT = 3;