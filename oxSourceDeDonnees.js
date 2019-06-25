function oxSourceDeDonnees (donnees, configuration) {
	var instance = this;

	configuration = $.extend({}, {
		cheminWorker: ''
	},
	configuration);
	const FILS = configuration && configuration.fils || "OxFils";
	const PARENT = configuration && configuration.parent || "OxParent";
	const OUVERTPARDEFAUT = configuration && configuration.ouvertParDefaut || "OxOuvertParDefaut";
	const NUMPARENTE = "OxNumeroParente";
	var donneesPretesAEtreUtilisee = true;
	donnees = donnees ? donnees : [];

	function structurerDonnees (objATraiter, parent, numeroParente = 0) {
		var obj = objATraiter || donnees;
		obj && obj.forEach(function(elt) {
			elt[PARENT] = parent;
			elt[NUMPARENTE] = numeroParente;
			elt[FILS] && structurerDonnees(elt[FILS], elt, numeroParente + 1);
		});
	}

	function reconstruireDonnees(blocksDeDonnees) {
		blocksDeDonnees.forEach(function (block) {
			donnees = donnees.concat(block);
		});
		donneesPretesAEtreUtilisee = true;
	}

	function construireWorkersInitialisation (){
		donneesPretesAEtreUtilisee = false;
		var nbWorker = 10;	
		var blocksDeDonnees = new Array(nbWorker);
		var nbBlocksRecus = 0;
		var tailleBlock = Math.ceil(donnees.length / nbWorker);
		for (var i = 0 ; i < nbWorker ; i++){
			var wsd = new Worker(configuration.cheminWorker + "OxWorkerStructurerDonnees.js");
			wsd.postMessage([donnees.splice(0, tailleBlock), { fils: FILS, parent: PARENT, numParente: NUMPARENTE, numeroDeBlock: i }]);
			wsd.onmessage = function(e) {
				blocksDeDonnees[e.data[1]] = e.data[0];
				nbBlocksRecus++;
				if (nbBlocksRecus >= nbWorker)
					reconstruireDonnees(blocksDeDonnees);
			}
		}
	}
		
	function parcourirAction(obj, options) {
		var correspond = true;
		var donnees = null;
		Object.keys(options).forEach(function(opt) {
			if (typeof options[opt] == "object")
				donnees = parcourirAction(obj[opt], options[opt]);
			else if (obj[opt] != options[opt])
				correspond = false;
		});
		if (obj.donnees && correspond)
			return { donnees: obj.donnees, options: options };
		return donnees;
	}

	function rechercherDonneesCalculees(obj, options, act) {
		var action = Object.keys(options || {})[0];
		if (action && ~action.indexOf("null"))
			return { donnees: obj.donnees || donnees, parent: obj, selecteur: act };
		if (obj){
			if (action && options[action])
				return rechercherDonneesCalculees(obj[action], options[action], action);
			else
				return { donnees: obj.donnees || donnees, donneesAAfficher: obj.donneesAAfficher || null, parent: obj, selecteur: act };
		}
		throw("impossible de trouver les données");
	}

	// pour savoir si l'action a déjà été effectuée
	/*function estDejaCalcule (listeFreres, objDonneesRecherchees, type, nomProp, param, options) {
		if ((!options && listeFreres.action && listeFreres.action[type + nomProp + ';' + param]) ||
			(objDonneesRecherchees && objDonneesRecherchees.selecteur == type + nomProp + ';' + param) ||
			(objDonneesRecherchees && objDonneesRecherchees.selecteur && objDonneesRecherchees.parent[objDonneesRecherchees.selecteur][type + nomProp + ';' + param]))
			return true;
		return false;
	}*/

	// pour savoir si l'action a déjà été effectuée
	function estDejaCalcule (listeFreres, /*objDonneesRecherchees, type, nomProp, param,*/ options) {
		if (!listeFreres.action)
			return;
		/*var opt = options;
		while (opt && Object.keys(opt)[0])
			opt[Object.keys(opt)[0]] == null && (opt[Object.keys(opt)[0]] = {}), opt = opt[Object.keys(opt)[0]];
		opt[type + nomProp + ';' + param] = null;
		var d = {};
		d[FILS] = listeFreres;
		try { instance.getElements(d, null, null, options); }
		catch (e) { return false; }*/
		try {
			rechercherDonneesCalculees(listeFreres.action, options);
			return true;
		}
		catch (e) { return false; }
	}

	function structurerDonneesRecherchees (listeFreres, options) {
		if (options && listeFreres.action)
			return objDonneesRecherchees = rechercherDonneesCalculees(listeFreres.action, options);
		listeFreres.action = listeFreres.action || {};
		return { donnees: listeFreres, parent: listeFreres.action, selecteur: null };
	}

	/**
	 *	prop: propriété de l'objet servant pour la recherche
	 *	valeur: valeur de cette propriété
	 **/
	this.getElement = function(parent, prop, valeur) {
		var listeElements = parent ? parent[FILS] : donnees;
		for (var i = 0 ; i < listeElements.length ; i++)
			if (listeElements[i][prop] == valeur)
				return listeElements[i];
	}

	this.getElements = function (parent, index, nbElements/*, options*/){
		var listeElements = parent ? parent[FILS] : donnees;
		//if (options)
		listeElements = gestionDesActionsDeSubsomption.getDonneesAAffichees(listeElements) || listeElements;
			//listeElements = rechercherDonneesCalculees(listeElements.action, options).donnees;
		if (nbElements)
			return listeElements.slice(index, index + nbElements);
		else
			return index != undefined ? listeElements[index] : listeElements;
	}

	this.getIndex = function(elt, tenirCompteSubsomption) {
		var listeFreres = elt[PARENT] ? elt[PARENT][FILS] : donnees;
		if (tenirCompteSubsomption)
			return instance.getElements(elt[PARENT]).indexOf(elt);
		else
			return listeFreres.indexOf(elt);
	}

	this.getNombreFils = function(elt) {
		return elt[FILS] ? elt[FILS].length : null;
	}

	this.abonnerEvenement = function(evt, fonction) {
		if (configuration) {
			if (!configuration[evt])
				configuration[evt] = fonction;
			else {
				if (!Array.isArray(configuration[evt]))
					configuration[evt] = [configuration[evt]];
				configuration[evt].push(fonction);
			}
		}
		else{
			configuration = {};
			configuration[evt] = fonction;
		}
	}

	this.supprimerEvenement = function(evt, fonction) {
		if (Array.isArray(configuration[evt])) {
			var indexEltASupprimer = configuration[evt].getIndex(fonction);
			if (indexEltASupprimer >= 0)
				listeFreres.splice(instance.getIndex(elt), 1);
			else
				throw ("L'évènement n'existe pas.");
			configuration[evt].length == 1 && (configuration[evt] = configuration[evt][0]);
		}
		else if (configuration[evt] == fonction)
			configuration[evt] = null
		else
			throw ("L'évènement n'existe pas.");
	}

	this.ajouterElement = function(elt, parent, index){
		parent && !parent[FILS] && (parent[FILS] = []);
		var listeElements = parent ? parent[FILS] : donnees;
		elt[PARENT] = parent ? parent : undefined;
		elt[NUMPARENTE] = parent ? parent[NUMPARENTE] + 1 : 0;
		if (Number.isInteger(index))
			listeElements.splice(index, 0, elt);
		else
			listeElements.push(elt);

		delete donnees.action;
		//delete donnees.oxDonneesAffichees;

		if (configuration && typeof configuration.ajout == "function")
			configuration.ajout(elt);
		else if (configuration && Array.isArray(configuration.ajout))
			configuration.ajout.forEach(function(fonction) {
				fonction(elt);
			});
	}

	this.ajouterElements = function(listeElts, parent, index){
		parent && !parent[FILS] && (parent[FILS] = []);
		var listeElements = parent ? parent[FILS] : donnees;
		for (var i = 0 ; i < listeElts.length ; i++) {
			listeElts[i][PARENT] = parent ? parent : undefined;
			listeElts[i][NUMPARENTE] = parent ? parent[NUMPARENTE] + 1 : 0;
		}
		listeElts.reverse();
		for (var i = listeElts.length - 1 ; i >= 0 ; i--) {
			if (Number.isInteger(index))
				listeElements.splice(index, 0, listeElts[i]);
			else
				listeElements.push(listeElts[i]);
		}

		//delete donnees.action;
		//delete donnees.oxDonneesAffichees;

		if (configuration && typeof configuration.ajout == "function")
			configuration.ajout(listeElements);
		else if (configuration && Array.isArray(configuration.ajout))
			configuration.ajout.forEach(function(fonction) {
				fonction(listeElements);
			});
	}

	this.supprimerElement = function(elt) {
		var listeFreres = elt[PARENT] ? elt[PARENT][FILS] : donnees;
		var indexEltASupprimer = instance.getIndex(elt);
		if (indexEltASupprimer >= 0)
			listeFreres.splice(instance.getIndex(elt), 1);

		gestionDesActionsDeSubsomption.supprimerElement(listeFreres, elt);

		//delete donnees.action;
		//delete donnees.oxDonneesAffichees;

		if (configuration && typeof configuration.suppression == "function")
			configuration.suppression(elt, indexEltASupprimer);
		else if (configuration && Array.isArray(configuration.suppression))
			configuration.suppression.forEach(function(fonction) {
				fonction(elt, indexEltASupprimer);
			});

		return indexEltASupprimer;
	}

	this.supprimerFils = function(eltParent) {
		var nbEltsASupprimer = eltParent ? eltParent[FILS] && eltParent[FILS].length || 0 : donnees.length;
		if (eltParent){
			delete eltParent[FILS];

			//delete donnees.action;
			//delete donnees.oxDonneesAffichees;
		}
		else
			donnees = [];

		if (configuration && typeof configuration.suppressionFils == "function")
			configuration.suppressionFils(eltParent, nbEltsASupprimer);
		else if (configuration && Array.isArray(configuration.suppressionFils))
			configuration.suppressionFils.forEach(function(fonction) {
				fonction(eltParent, nbEltsASupprimer);
			});

		return nbEltsASupprimer;
	}

	this.supprimerElementParIndex = function(parent, index) {
		var eltSupprime = parent[FILS].splice(index, 1);

		//delete donnees.action;
		//delete donnees.oxDonneesAffichees;

		if (configuration && typeof configuration.suppression == "function")
			configuration.suppression(eltSupprime, indexEltASupprimer);
		else if (configuration && Array.isArray(configuration.suppression))
			configuration.suppression.forEach(function(fonction) {
				fonction(eltSupprime, indexEltASupprimer);
			});
	}

	this.modifierElement = function(elt, nvlValeurs) {
		Object.keys(nvlValeurs).forEach(function(nomProp) {
			elt[nomProp] = nvlValeurs[nomProp];
		});

		if (configuration && typeof configuration.modification == "function")
			configuration.modification(elt);
		else if (configuration && Array.isArray(configuration.modification))
			configuration.modification.forEach(function(fonction) {
				fonction(elt);
			});
	}

	this.deplacerElement = function(elt, parent, nvlPosition) {
		var listeFreres = parent ? parent[FILS] : donnees;
		var indexEltADeplacer = instance.getIndex(elt);
		var eltADeplacer = listeFreres.splice(indexEltADeplacer, 1)[0];
		listeFreres.splice(/*indexEltADeplacer < nvlPosition ? nvlPosition - 1 : */nvlPosition, 0, eltADeplacer);

		if (configuration && typeof configuration.deplacement == "function")
			configuration.deplacement(elt, indexEltADeplacer);
		else if (configuration && Array.isArray(configuration.deplacement))
			configuration.deplacement.forEach(function(fonction) {
				fonction(elt, indexEltADeplacer);
			});
	}

	/*this.detruire = function () {
		goulag.detruire();
	}*/

	/*function construireWorkers (nomWorker, donneesATraiter, options, fonctionRetour) {
		var listeWorkers = {};
		var nbWorker = 6;
		var blocksDeDonnees = new Array();
		var nbBlocksRecus = 0;
		var tailleBlock = Math.ceil(donneesATraiter.length / nbWorker);

		for (var i = 0 ; i < nbWorker ; i++){
			var wsd = new Worker(nomWorker);
			!listeWorkers[nomWorker] && (listeWorkers[nomWorker] = new Array());
			listeWorkers[nomWorker].push(wsd);
			options.numeroDeBlock = i;
			wsd.postMessage([donneesATraiter.slice(tailleBlock * i, tailleBlock * i + tailleBlock), options]);

			wsd.onmessage = function(e) {
				blocksDeDonnees = blocksDeDonnees.concat(e.data[0]);
				nbBlocksRecus++;
				if (nbBlocksRecus >= nbWorker) {								// le tri est terminé
					donneesATraiter.action = donneesATraiter.action ? donneesATraiter.action : {};
					donneesATraiter.action["tri;" + options.nomProp + ';' + options.sens] = { donnees: e.data[0] };			// probleme tri croissant ou decroissant(2 objets)
					if (typeof configuration.tri == "function")
						configuration.tri(e.data[0]);
				}
				if (nbBlocksRecus == nbWorker)
					wsd.postMessage([blocksDeDonnees, options]);
			};
		}
	}*/

	/*this.filtrer = function(elt, nomProp, critere, options) {
		var listeFreres = elt ? elt[FILS] : donnees;
		if (!listeFreres)
			return;
		// si critere est vide il faut suprimer le filtre
		var nomPropTemp, optTemp = options, filsAffichesTemp = listeFreres.oxDonneesAffichees;
		if (optTemp)
			do {
				nomPropTemp = Object.keys(optTemp)[0];
				if (nomPropTemp && ~nomPropTemp.indexOf(';' + nomProp + ';') && !critere){
					delete optTemp[nomPropTemp];
					delete filsAffichesTemp[nomPropTemp];
				}
				if (listeFreres.oxDonneesAffichees && !Object.keys(listeFreres.oxDonneesAffichees).length)
					delete listeFreres.oxDonneesAffichees;
				optTemp = optTemp[nomPropTemp];
				filsAffichesTemp = filsAffichesTemp[nomPropTemp];
			}
			while (optTemp);
		try {
			var infosSpecifiques = rechercherDonneesCalculees(listeFreres.action, options);
		} catch (e) {}

		instance.objFiltre = !instance.objFiltre ? new function () {
			var t = this;
			this.retour = function (travail) {
				var objEnCours = !t.objDonneesRecherchees.selecteur ? t.objDonneesRecherchees.parent : t.objDonneesRecherchees.parent[t.objDonneesRecherchees.selecteur];
				objEnCours["filtre;" + travail.options.nomProp + ';' + travail.options.critere] = { donnees: travail.blocksDeDonnees };
				if (configuration && typeof configuration.filtre == "function")
					configuration.filtre(travail.blocksDeDonnees);
			}
		} : instance.objFiltre;
		instance.objFiltre.objDonneesRecherchees = structurerDonneesRecherchees(listeFreres, options);

		if (!critere && configuration && typeof configuration.filtre == "function") {					// si pas de critère on revient à la normal
			configuration.filtre(infosSpecifiques ? infosSpecifiques.donnees : listeFreres, options);
			return;
		}

		var options = options || {};
		var opt = options;
		var chemin = opt && Object.keys(opt)[0];
		var parent;
		if (chemin)
			do {
				opt[chemin] == null && (opt[chemin] = {});
				parent = opt;
				opt = opt[chemin];
				chemin = Object.keys(opt)[0];
			}
			while (chemin);
		while (opt && Object.keys(opt)[0])
			opt[Object.keys(opt)[0]] == null && (opt[Object.keys(opt)[0]] = {}), opt = opt[Object.keys(opt)[0]];
		if (!parent || !~Object.keys(parent)[0].indexOf("filtre;" + nomProp))
			opt["filtre;" + nomProp + ';' + critere] = {};
		else if (parent) {
			delete parent[Object.keys(parent)[0]];
			if (infosSpecifiques)
				infosSpecifiques = rechercherDonneesCalculees(listeFreres.action, options);
			parent["filtre;" + nomProp + ';' + critere] = {};
		}

		try {
			var donneesDejaRecherchees = rechercherDonneesCalculees(listeFreres.action, options);
		} catch (e) {}
		if (donneesDejaRecherchees){
			if (configuration && typeof configuration.filtre == "function")
				configuration.filtre(donneesDejaRecherchees.donnees, options);
		}
		else{
			var donneesFiltrees = new Array();
			var regexp = new RegExp(critere, "gi");
			(infosSpecifiques ? infosSpecifiques.donnees : listeFreres).filter(function(obj) {
				if (typeof obj[nomProp] == "undefined")
					throw("propriété " + nomProp + " absente");
				var test = obj[nomProp].match(regexp);
				if (test && test.length)
					donneesFiltrees.push(obj);
			});
			if (infosSpecifiques)
				infosSpecifiques.parent["filtre;" + nomProp + ';' + critere] = { donnees: donneesFiltrees };
			else {
				listeFreres.action = listeFreres.action || {};
				listeFreres.action["filtre;" + nomProp + ';' + critere] = { donnees: donneesFiltrees };
			}
			if (configuration && typeof configuration.filtre == "function")
				configuration.filtre(donneesFiltrees, options);
		//	goulag.travailler("OxWorkerFiltrerDonnees.js", instance.objFiltre.objDonneesRecherchees.donnees, { nomProp: nomProp, critere: critere }, instance.objFiltre.retour);
		}
	}*/

	var gestionDesActionsDeSubsomption = new function () {
		var gdads = this;
		//var listeDesActionsDeSubsomption = new Array();
		var criteresDeTri = new Array();
		var listeFiltres = new Array();
		var objDonneesInitiales;
		var noeudAFiltrer;
		var donneesInitiales;														// permet de savoir à quel niveau de la source de données se situe le traitement
		var derniereAction;
		var cheminDonneesAffichees;
		var donneesAffichees;

		var donneesGroupees;
		var donneesTriees;
		var donneesFiltrees;
		var donneesAAfficher;
		var nomPropPrec;

		function avertirObjAppelant (d) {
			//if ()				// TODO tester s'il n'y a pas des actions ultérieurs auquel cas on n'informe pas l'objet appelant.
			if (typeof configuration[derniereAction] == "function")
				configuration[derniereAction](d, gdads.getDonneesAAffichees(donneesInitiales), false);
			else if (Array.isArray(configuration[derniereAction]))
				configuration[derniereAction].forEach(function(fonction) {
					fonction(d, gdads.getDonneesAAffichees(donneesInitiales), false);		//true si donneesAffichees, false si donnees
				});
		}

		function trier (donnees, criteresDeTri) {
			var donneesClonees = donnees.slice();
			var groupe = false;
			donneesClonees.sort(function(a, b) {
				for (var i = 0 ; i < criteresDeTri.length ; i++) {
					var nomProp = criteresDeTri[i].nomProp;
					groupe = criteresDeTri[i].action == "groupe" ? true : groupe;			// permet de savoir s'il y a au moins un groupe
					var sens = criteresDeTri[i].sens;
					if (typeof a[nomProp] == "undefined")
						throw("propriété " + nomProp + " absente");
					var val1, val2;
					sens == "decroissant" ? (val2 = a[nomProp], val1 = b[nomProp]) : (val1 = a[nomProp], val2 = b[nomProp]);
					if (typeof a[nomProp] == "string" && a[nomProp] != parseFloat(a[nomProp]))				// pour ne pas traiter les nombres sous forme de chaine
						if (val1.localeCompare(val2) == 1)
							return 1;
						else if (val1.localeCompare(val2) == -1)
							return -1;
						else
							continue;
					if (val1 > val2)
						return 1;
					else if (val1 < val2)
						return -1;
					continue;
				}
			});
			donneesTriees = donneesClonees;
			if (groupe){
				var structure = gdads.creerStructureDonneesAffichables();
				donneesGroupees = gdads.genererDonneesAffichables(structure.OxFils);
			}
			//donneesInitiales.oxDonneesAffichees = donneesGroupees || donneesTriees;
			//avertirObjAppelant(donneesGroupees || donneesTriees);
		}

		instance.grouper = function (donneesATraiter, listeGroupes, listePropDeRegroup) {
			var listeFreres = donneesATraiter ? donneesATraiter[FILS] : donnees;
			donneesInitiales = listeFreres;
			derniereAction = "groupe";

			for (var i = listeGroupes.length - 1; i >= 0; i--)
				criteresDeTri.unshift({ nomProp: listeGroupes[i][listePropDeRegroup[i]], sens: listeGroupes[i].oxSensTri, action: "groupe" });
			for (var i = criteresDeTri.length - 1; i >= listeGroupes.length ; i--)
				if (criteresDeTri[i].action == "groupe")
					criteresDeTri.splice(i, 1);

			donneesTriees = null;
			donneesGroupees = null;
			if (criteresDeTri.length)
				trier(listeFreres, criteresDeTri);
				//goulag.travailler(configuration.cheminWorker + "OxWorkerTrierDonnees.js", listeFreres, criteresDeTri, gdads.retour);
			donneesTriees && instance.filtrer(donneesTriees[PARENT]);
			avertirObjAppelant(donneesGroupees || donneesFiltrees || donneesTriees || listeFreres);
		}

		instance.trier = function (donneesATraiter, nomProp, sens, cumul) {
			var listeFreres = donneesATraiter ? donneesATraiter[FILS] : donnees;
			donneesInitiales = listeFreres;
			derniereAction = "tri";
			var indexTriSiExiste;
			for (var i = 0; i < criteresDeTri.length; i++)
				if (criteresDeTri[i].nomProp == nomProp)
					indexTriSiExiste = i;

			if (!cumul && sens){
				for (var i = 0; i < criteresDeTri.length; i++)
					if (criteresDeTri[i].action != "groupe")
						criteresDeTri.splice(i, 1);
				criteresDeTri.push({ nomProp: nomProp, sens: sens, action: "tri" });
			}
			else if (indexTriSiExiste != undefined && sens)
				criteresDeTri[indexTriSiExiste] = { nomProp: nomProp, sens: sens, action: "tri" };
			else if (indexTriSiExiste == undefined && sens)
				criteresDeTri.push({ nomProp: nomProp, sens: sens, action: "tri" });
			else
				criteresDeTri.splice(indexTriSiExiste, 1);

			if (criteresDeTri.length)
				trier(listeFreres, criteresDeTri);
				//goulag.travailler(configuration.cheminWorker + "OxWorkerTrierDonnees.js", listeFreres, criteresDeTri, gdads.retour);
			else
				donneesTriees = null;
				//delete donneesInitiales.oxDonneesAffichees;
			avertirObjAppelant(donneesGroupees || donneesFiltrees || donneesTriees || listeFreres);
		}

		instance.filtrer = function(donneesATraiter, nomProp, critere) {
			var listeFreres = donneesATraiter ? donneesATraiter[FILS] : donnees;
			if (!listeFreres)
				return;

			noeudAFiltrer = donneesATraiter;
			for (var i = listeFiltres.length - 1 ; i >= 0  ; i--)
				if (listeFiltres[i].nomProp == nomProp && !critere)
					listeFiltres.splice(i, 1);
				else if (listeFiltres[i].nomProp == nomProp) {
					listeFiltres[i].critere = critere;
					critere = '';
				}
			if (critere && critere.length)
				listeFiltres.push({ nomProp: nomProp, critere: critere, action: "filtre" });

			donneesInitiales = listeFreres;
			derniereAction = "filtre";
			var donneesATraiter = listeFreres;
			if (donneesTriees && listeFreres == donneesInitiales)
				donneesATraiter = donneesTriees;
			donneesFiltrees = new Array();
			for (var i = 0 ; i < listeFiltres.length ; i++) /*for (var nP in listeFiltres[i]) */{
				var regexp = new RegExp(listeFiltres[i].critere, "gi");
				donneesFiltrees = new Array();
				donneesATraiter.filter(function (obj) {
					if (typeof obj[listeFiltres[i].nomProp] == "undefined")
						throw("propriété " + listeFiltres[i].nomProp + " absente");
					var test = obj[listeFiltres[i].nomProp].toString().match(regexp);
					if (obj[listeFiltres[i].nomProp].constructor.name == "Number" ? obj[listeFiltres[i].nomProp] == listeFiltres[i].critere : test && test.length)
						donneesFiltrees.push(obj);
				});
				donneesATraiter = donneesFiltrees;
			}
			 if (!listeFiltres.length)
				 donneesFiltrees = null;
			if (donneesGroupees) {
				var structure = gdads.creerStructureDonneesAffichables();
				donneesGroupees = gdads.genererDonneesAffichables(structure.OxFils);
			}
			//donneesInitiales.oxDonneesAffichees = donneesGroupees || donneesFiltrees;
			avertirObjAppelant(donneesGroupees || donneesFiltrees || donneesTriees || listeFreres);
		}

		instance.reinitialiserSubsomption = function () {
			donneesGroupees = null;
			donneesFiltrees = null;
			donneesTriees = null;
			//donneesInitiales && delete donneesInitiales.oxDonneesAffichees;
		}

		this.supprimerElement = function (listeDonnees, elt) {
			if (instance.estDonneesFiltrees(listeDonnees)) {
				for (var i = 0; i < donneesFiltrees.length; i++)
					if (donneesFiltrees[i] == elt) {
						donneesFiltrees.splice(i, 1);
						break;
					}
			}
			if (instance.estDonneesTriees(listeDonnees)) {
				for (var i = 0; i < donneesTriees.length; i++)
					if (donneesTriees[i] == elt) {
						donneesTriees.splice(i, 1);
						break;
					}
			}
			if (instance.estDonneesGroupees(listeDonnees)) {
				var structure = gestionDesActionsDeSubsomption.creerStructureDonneesAffichables();
				donneesGroupees = gestionDesActionsDeSubsomption.genererDonneesAffichables(structure.OxFils);
			}
		}

		/*this.retour = function (travail) {
			if (travail.nbBlocksRecus == goulag.getNbTravailleurs()) {
				travail.listeTravailleur[0].postMessage([travail.blocksDeDonnees, criteresDeTri]);
				travail.blocksDeDonnees = [];
			}
			else {								// le tri est terminé
				donneesTriees = travail.blocksDeDonnees;

				if (listeDesRegroupements.length){
					var structure = gdads.creerStructureDonneesAffichables();
					donneesGroupees = gdads.genererDonneesAffichables(structure.OxFils);
				}
				donneesInitiales.oxDonneesAffichees = donneesGroupees || donneesTriees;
				avertirObjAppelant(donneesGroupees || donneesTriees);
			}
		}*/

		this.getDonneesAAffichees = function (donnees) {
			if (donneesInitiales == donnees)
				return donneesGroupees || donneesFiltrees || donneesTriees;
			else
				return donnees;
		}

		instance.estDonneesFiltrees = function (d) {
			if (d == donneesInitiales)
				return donneesFiltrees ? true : false;
			return false;
		}

		instance.estDonneesTriees = function (d) {
			if (d == donneesInitiales)
				return donneesTriees ? true : false;
			return false;
		}

		instance.estDonneesGroupees = function (d) {
			if (d == donneesInitiales)
				return donneesGroupees ? true : false;
			return false;
		}

		instance.getListeActionsDeSubsomption = function () {
			return criteresDeTri.concat(listeFiltres);
		}

		function creerEnteteGroupe (donnee, nomProp, i) {
			return {
				OxEnteteGroupe: true,
				OxDeploye: configuration && configuration[OUVERTPARDEFAUT] || false,
				OxNomProp: nomProp,
				OxCritere: donnee[nomProp],
				OxNbElements: 0,
				OxNiveauGroupe: 0,
				OxFils: [],
				OxCalculerDonneesAffichables: gdads.etendreDonneesAffichables
			};
		}

		this.creerStructureDonneesAffichables = function () {
			function rechercherEntetePrecedemmentCree (entete, liste) {
				var enteteRecherche;

				for (var i = 0 ; i < liste.length ; i++) {
					if (entete.OxNiveauGroupe > liste[i].OxNiveauGroupe)
						enteteRecherche = creerStructureDonneesAffichables(entete, liste[i].OxFils);
					else if (liste[i].OxEnteteGroupe && liste[i].OxNomProp == entete.OxNomProp && liste[i].OxCritere == entete.OxCritere)
						enteteRecherche = liste[i];
					if (enteteRecherche)
						return enteteRecherche;
				}
				return {};
			}

			var listeGroupes = new Array();
			for (var i = 0 ; i < criteresDeTri.length ; i++)
				if (criteresDeTri[i].action == "groupe")
					listeGroupes.push(criteresDeTri[i].nomProp);

			var structureDonneesAffichables = { OxFils: [] };
			var structureCourante = structureDonneesAffichables;
			var listeValeurGroupesCourant = new Array();

			var donneesAStructurer = donneesFiltrees || donneesTriees;
			for (var i = 0 ; i < donneesAStructurer.length ; i++) {
				var donnee = donneesAStructurer[i];
				for (var j = 0 ; j < listeGroupes.length ; j++) {
					var refGroupe = listeGroupes[j];
					if (listeValeurGroupesCourant[j] == undefined ||
						donnee[refGroupe].constructor.name == "Date" && donnee[refGroupe].toDateString() != listeValeurGroupesCourant[j].toDateString() ||
						donnee[refGroupe].constructor.name != "Date" && donnee[refGroupe] != listeValeurGroupesCourant[j]){
						var enteteGroupe = creerEnteteGroupe(donnee, refGroupe);
						if (donneesGroupees && rechercherEntetePrecedemmentCree(enteteGroupe, donneesGroupees[0].OxParentGroupe.OxFils).OxDeploye)
							enteteGroupe.OxDeploye = true;
						enteteGroupe.OxNiveauGroupe = j;
						structureCourante.OxFils.push(enteteGroupe);
						enteteGroupe.OxParentGroupe = structureCourante;
						listeValeurGroupesCourant[j] = donnee[refGroupe];
						for (var y = j + 1 ; y < listeGroupes.length ; y++)		// si le groupe de plus haut niveau change on réinitialise le mémorisation des suivants.
							listeValeurGroupesCourant[y] = null;
					}
					structureCourante = structureCourante.OxFils[structureCourante.OxFils.length - 1];
				}

				structureCourante.OxFils.push(donnee);
				structureCourante = structureDonneesAffichables;
			}

			return structureCourante;
		}

		this.genererDonneesAffichables = function(structureDonneesAffichables, d) {
			donneesGroupees = d || new Array();
			var structure = structureDonneesAffichables
			for (var i = 0 ; i < structure.length ; i++) {
				donneesGroupees.push(structure[i]);
				structure[i].OxNbElements != undefined && (structure[i].OxNbElements = structure[i].OxFils.length);
				if (structure[i].OxDeploye)
					gdads.genererDonneesAffichables(structure[i].OxFils, donneesGroupees);
			}

			return donneesGroupees;
		}

		this.etendreDonneesAffichables = function (objEnteteGroupe) {
			var parent;
			do { parent = parent ? parent.OxParentGroupe : objEnteteGroupe.OxParentGroupe; }
			while (parent.OxParentGroupe);
			return gdads.genererDonneesAffichables(parent.OxFils);
		}
	}

	console.time("creation");
	if (!configuration || !configuration.initialisationOptimisee)
		structurerDonnees();
	else if (configuration.initialisationOptimisee != "désactivée")
		construireWorkersInitialisation();
	console.timeEnd("creation");
}

/*var goulag = new (function Goulag () {
	var listeTravaux = {};
	var listeTravailleurs = [];
	var nbTravailleurs = 6;

	this.travailler = function (nomTravail, donnees, critereDeTri, fctRetour/*objetDeTravail, options*//*) {
		var donneesATraiter = donnees/*objetDeTravail.getDonnees()*//*;
		var tailleBlock = Math.ceil(donneesATraiter.length / nbTravailleurs);

		if (!listeTravaux[nomTravail]) {
			listeTravaux[nomTravail] = { listeTravailleur: [], blocksDeDonnees: [], nbBlocksRecus: 0, options: critereDeTri/*objetDeTravail.getCriteres()*//* };
			for (var i = 0 ; i < nbTravailleurs ; i++) {
				var travailleur = new Worker(nomTravail);
				listeTravailleurs.push(travailleur);
				listeTravaux[nomTravail].listeTravailleur.push(travailleur);

				travailleur.onmessage = function(e) {
					listeTravaux[nomTravail].blocksDeDonnees = listeTravaux[nomTravail].blocksDeDonnees.concat(e.data[0]);
					listeTravaux[nomTravail].nbBlocksRecus++;
					if (listeTravaux[nomTravail].nbBlocksRecus >= nbTravailleurs)								// le tri est terminé
						fctRetour/*objetDeTravail.retour*//*(listeTravaux[nomTravail]);
				};
			}
		}
		listeTravaux[nomTravail].blocksDeDonnees = [];
		listeTravaux[nomTravail].nbBlocksRecus = 0;
		listeTravaux[nomTravail].options = critereDeTri/*objetDeTravail.getCriteres()*//*;
		for (var i = 0 ; i < nbTravailleurs ; i++)
			listeTravaux[nomTravail].listeTravailleur[i].postMessage([donneesATraiter.slice(tailleBlock * i, tailleBlock * i + tailleBlock), critereDeTri/*objetDeTravail.getCriteres()*//*]);
	}

	this.getNbTravailleurs = function () {
		return nbTravailleurs;
	}

	this.detruire = function () {
		if (listeTravailleurs.length)
			for (var i = 0 ; i < nbTravailleurs ; i++)
				listeTravailleurs[i].terminate();
		listeTravaux = {};
		listeTravailleurs = [];
	}
})();*/