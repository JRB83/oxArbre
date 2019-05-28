function OxCaseACocher (element, options) {
	var instance = this;
	options = $.extend({}, { mode: OxCaseACocher.prototype.mode.CASEACOCHER, theme: 1 }, options);
	var etat = options.etat || (element.hasAttribute("checked") ? OxCaseACocher.prototype.etats.COCHE : OxCaseACocher.prototype.etats.DECOCHE);
	var sauvegardeDIV;

	element.type = options.mode;
	if (options.estCoche)
		element.checked = "checked";
	var idCC = element.getAttribute("id");
	var label = idCC && document.querySelector("[for=" + idCC + "]");
	if (!label) {
		label = document.createElement("label");
		if (!idCC){
			idCC = "oxCC" + OxCaseACocher.prototype.compteur++;
			element.setAttribute("id", idCC);
		}
		label.setAttribute("for", idCC);
		element.insertAdjacentHTML('afterend', label.outerHTML);
		label = element.parentNode.querySelector("[for=" + idCC + "]");
	}
	var mode = options.mode == OxCaseACocher.prototype.mode.CASEACOCHER ? "caseACocher" : "boutonRadio";
	label.className += (label.className.length ? ' ' : '') + "ox-" + mode + " ox-theme-" + options.theme;
	element.className += (element.className.length ? ' ' : '') + "ox-inputDesactivee";

	label.addEventListener("click", arretPropagation);

	if (options.theme > 1)
		encapsulerBalise();

	if (options.desactive || element.hasAttribute("disabled"))
		instance.desactiver();

	function gestionEvenement (evt, origine) {
		if (typeof options.changement == "function")
			options.changement(evt, etat, origine);
		if (typeof options.decoche == "function" && etat == 0)
			options.decoche(evt, etat, origine);
		else if (typeof options.coche == "function" && etat == 1)
			options.coche(evt, etat, origine);
		else if (typeof options.indetermine == "function" && etat == 2)
			options.indetermine(evt, etat, origine);
	}

	function remplacerDivParInput () {
		var nvleBalise = document.createElement('input');
		for (var attr of element.attributes)
			nvleBalise.setAttribute(attr.nodeName, attr.nodeValue);
		nvleBalise.setAttribute("type", "checkbox");
		sauvegardeDIV = element;
		element.after(nvleBalise);
		element.remove();
		element = nvleBalise;
	}

	function encapsulerBalise () {
		var parent = document.createElement('div');
		var estCoche = element.checked;
		//parent.className = "ox-caseACocher ox-theme-" + options.theme;

		if (element.nodeName == "DIV")
			remplacerDivParInput();

		parent.innerHTML = element.outerHTML + label.outerHTML;
		element.parentNode.insertBefore(parent, element);

		element.remove();
		label.remove();

		element = parent.querySelector("[id=" + idCC + "]");
		label = parent.querySelector("[for=" + idCC + "]");

		estCoche && (element.checked = "checked");

		parent.setAttribute("id", element.id);
		element.id = element.id + 'd';
		label.attributes.for.value = label.attributes.for.value + 'd';
		for (var attr of label.attributes)
			parent.setAttribute(attr.nodeName, attr.nodeValue);

		$(element).data("OxCaseACocher", instance);
		label.className = label.className.replace(/ ?ox-caseACocher/g, '').replace(/ ?ox-boutonRadio/g, '').replace(/ ?ox-theme-\d/g, '');
		parent.addEventListener("click", arretPropagation);
	}

	function decapsulerBalise () {
		var parent = element.parentNode;
		parent.parentNode.insertBefore(element, parent);
		parent.parentNode.insertBefore(label, parent);
		parent.removeEventListener("click", arretPropagation);
		label.removeEventListener("click", arretPropagation);

		for (var attr of parent.attributes)
			label.setAttribute(attr.nodeName, attr.nodeValue);

		parent.remove();
	}

	this.getConteneur = function () {
		return sauvegardeDIV ? $(element).parent() : element;
	}

	this.cocher = function () {
		element.click();
	}

	this.modifierEtat = function (nvlEtat, transmettreEvt) {
		if (nvlEtat == etat)
			return;
		etat = nvlEtat;
		label.className = label.className.replace(/ ?ox-etatIndetermine/g, '');
		element.checked = false;
		nvlEtat == OxCaseACocher.prototype.etats.COCHE && (element.checked = true);
		nvlEtat == OxCaseACocher.prototype.etats.INDETERMINE && (label.className += ' ' + "ox-etatIndetermine");
		transmettreEvt != false && gestionEvenement(null, "systeme");
	}

	this.getEtat = function () {
		return etat;
	}

	this.activer = function () {
		element.removeAttribute("disabled", "disabled");
		if (options.theme == 1)
			label.className = label.className.replace(/ ?ox-cc-desactive/g, '');
		else
			label.parentNode.className = label.parentNode.className.replace(/ ?ox-cc-desactive/g, '');
	}

	this.desactiver = function () {
		element.setAttribute("disabled", "disabled");
		if (options.theme == 1)
			label.className += ' ' + "ox-cc-desactive";
		else
			label.parentNode.className += ' ' + "ox-cc-desactive";
	}

	this.afficher = function () {
		if (options.theme == 1)
			label.style.display = "block";
		else
			label.parentNode.style.display = "block";
	}

	this.masquer = function () {
		if (options.theme == 1)
			label.style.display = "none";
		else
			label.parentNode.style.display = "none";
	}

	this.changerTheme = function (nouveauTheme) {
		if (options.theme == 1 && nouveauTheme != 1)
			encapsulerBalise();
		else if (nouveauTheme == 1 && options.theme != 1)
			decapsulerBalise();
		options.theme = nouveauTheme;
		if (options.theme == 1)
			label.className = label.className.replace(/ox-theme-\d/g, "ox-theme-" + options.theme);
		else
			label.parentNode.className = label.parentNode.className.replace(/ox-theme-\d/g, "ox-theme-" + options.theme);
	}

	this.changerMode = function (mode) {
		element.type = mode;
		var ancienMode = options.mode == OxCaseACocher.prototype.mode.CASEACOCHER ? "caseACocher" : "boutonRadio";
		var nouveauMode = mode == OxCaseACocher.prototype.mode.CASEACOCHER ? "caseACocher" : "boutonRadio";
		if (options.theme == 1)
			label.className = label.className.replace(ancienMode, nouveauMode);
		else
			label.parentNode.className = label.parentNode.className.replace(ancienMode, nouveauMode);
		options.mode = mode;
	}

	this.changerNom = function (nom) {
		element.name = nom;
	}

	this.detruire = function () {
		if (options.theme != 1)
			decapsulerBalise();
		element.className = element.className.replace(/ox-inputDesactivee/g, '');
		label.className = label.className.replace(/ox-caseACocher/g, '').replace(/ox-boutonRadio/g, '').replace(/ox-theme-\d/g, '').replace(/ox-etatIndetermine/g, '').replace(/ox-cc-desactive/g, '');
	
		if (sauvegardeDIV) {
			element.after(sauvegardeDIV);
			element.remove();
			sauvegardeDIV.className = sauvegardeDIV.className.replace(/ ?ox-inputDesactivee/g, '');
			sauvegardeDIV = null;
		}
	}

	element.addEventListener("change", function (e) {
		label.className = label.className.replace(/ ?ox-etatIndetermine/g, '');
		etat = etat == OxCaseACocher.prototype.etats.COCHE ? OxCaseACocher.prototype.etats.DECOCHE : OxCaseACocher.prototype.etats.COCHE;
		var org;
		gestionEvenement(e, (org = arguments.callee.caller) && org.name == "cocher" ? "systeme" : "utilisateur");
	});

	function arretPropagation (e) {
		e.stopPropagation();
	}
}

OxCaseACocher.prototype.compteur = 0;
OxCaseACocher.prototype.etats = {};
OxCaseACocher.prototype.etats.DECOCHE = 0;
OxCaseACocher.prototype.etats.COCHE = 1;
OxCaseACocher.prototype.etats.INDETERMINE = 2;

OxCaseACocher.prototype.mode = {};
OxCaseACocher.prototype.mode.CASEACOCHER = "checkbox";
OxCaseACocher.prototype.mode.RADIO = "radio";

$.fn.OxCaseACocher = function (options) {
	return this.each(function (key, value) {
		var element = $(this);
		if (element.data('OxCaseACocher'))
			return element.data('OxCaseACocher');
		var oObj = new OxCaseACocher(this, options);
		element.data('OxCaseACocher', oObj);
	});
};