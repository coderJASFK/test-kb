// encoding: utf-8
/*
 * Checkmk (https://checkmk.com)
 * @link https://checkmk.com
 * @copyright Copyright (c) 2022 Tribe29 GmbH. (https://www.tribe29.com)
 */

"use strict";

const LUNR_CONFIG = {
	"previewResultsClassName": "header-top__search__results" // class for the preview results
};


const locStrings = {
	"placeHolder" : {
		// "en" : "Search the checkmk docs",
		// "de" : "Suche im Checkmk Benutzerhandbuch"
        "de" : "Suche im Checkmk Benutzerhandbuch – Drücken Sie '–' um einen Suchbegriff einzugeben",
        "en" : "Search the Checkmk User Guide – Press '/' to enter a search term"
	},
	"nothingFound" : {
		"en" : "We didn't find any result for 'QUERY'. Sorry! – Help for search.",
		"de" : "Die Suche nach 'QUERY' lieferte keine Ergebnisse. – Hilfe zur Suche."
	},
	"viewAll" : {
		"en" : "See all NUMBER results for 'QUERY'",
		"de" : "Alle NUMBER Ergebnisse für 'QUERY' anzeigen"
	},
	"listHead" : {
		"en" : "Search results for 'QUERY'",
		"de" : "Suchergebnisse für 'QUERY'"
	},
	"searchHelp" : {
		"en" : "Help for search.",
		"de" : "Hilfe zur Suche."
	}
}

// Strings for nagging, when the user visits an outdated version
const nagStrings = {
	"1.6.0" : {
		"de" : "<div id=\"nagolddocsinner\"><p> Sie besuchen das Handbuch der <b>Checkmk-Version 1.6.0</b>, die seit dem <b>9. September 2022 nicht mehr unterstützt</b> wird. Wechseln Sie <a onclick=\"switchToLatest();\" href=\"#\">zur neuesten Version</a> dieser Handbuchseite.</p><p class=\"right\"><a onclick=\"closeNagscreen();\" href=\"#\">Nein danke!</a></p></div>",
		"en" : "<div id=\"nagolddocsinner\"><p>You are viewing the manual for <b>Checkmk version 1.6.0, which is out of support since September 9th, 2022</b>. Switch <a onclick=\"switchToLatest();\" href=\"#\">to the latest version</a> of this article.</p><p class=\"right\"><a onclick=\"closeNagscreen();\" href=\"#\">No thanks!</a></p></div>"
	},
	"2.0.0" : {
		"de" : "<div id=\"nagolddocsinner\"><p> Sie besuchen das Handbuch der <b>Checkmk-Version 2.0.0</b>, die seit dem <b>9. September 2023 nicht mehr unterstützt</b> wird. Wechseln Sie <a onclick=\"switchToLatest();\" href=\"#\">zur neuesten Version</a> dieser Handbuchseite.</p><p class=\"right\"><a onclick=\"closeNagscreen();\" href=\"#\">Nein danke!</a></p></div>",
		"en" : "<div id=\"nagolddocsinner\"><p>You are viewing the manual for <b>Checkmk version 2.0.0, which is out of support since September 9th, 2023</b>. Switch <a onclick=\"switchToLatest();\" href=\"#\">to the latest version</a> of this article.</p><p class=\"right\"><a onclick=\"closeNagscreen();\" href=\"#\">No thanks!</a></p></div>"
	},
    "2.1.0" : {
		"de" : "<div id=\"nagolddocsinner\"><p> Sie besuchen das Handbuch der <b>Checkmk-Version 2.1.0</b>, die seit dem <b>24. November 2024 nicht mehr unterstützt</b> wird. Wechseln Sie <a onclick=\"switchToLatest();\" href=\"#\">zur neuesten Version</a> dieser Handbuchseite.</p><p class=\"right\"><a onclick=\"closeNagscreen();\" href=\"#\">Nein danke!</a></p></div>",
		"en" : "<div id=\"nagolddocsinner\"><p>You are viewing the manual for <b>Checkmk version 2.1.0, which is out of support since November 24th, 2024</b>. Switch <a onclick=\"switchToLatest();\" href=\"#\">to the latest version</a> of this article.</p><p class=\"right\"><a onclick=\"closeNagscreen();\" href=\"#\">No thanks!</a></p></div>"
	}
}
const oldVersions = [ "1.5.0", "1.6.0", "2.0.0", "2.1.0" ]; // shared with update matrix

var domBlocked = 0;
var knwLang = "en";
var knwDebug = 3; // Set higher for more debugging verbosity

// Store the last search string so we do not call twice when someone enters
// a space. We should also strip all non-word characters...
var lastSearchString = "";
var cachedSearchResults = [];
// cache the search parameters
var getString = "";
var searchParams;
var openFullOverlay = 0;
var iAmLucky = 0;
var selectedResult = -1;
const highlightEntry = "#d5d5d5";

// Since the DOM tree will not change, we can parse it one and store relevant nodes to global variables
var menu;
var subheaders = [];

// The new start page has an overlay that can be added:
var featured;
var ytpreview;
var opaque;
var topicoverlay;

// Glossary overlay
var entered_overlay = 0;
var tout;
var artcontent;
// glossary content
var glossary_cont = {};
// cached breadcrumbs
var breadcrumbs = {};
const bcnotfound = {
    "en" : "Page not found in table of contents – this article might be outdated or an unfinished draft.",
    "de" : "Seite nicht im Inhaltsverzeichnis gefunden – dieser Artikel ist möglicherweise veraltet oder ein unvollendeter Entwurf."
};
const bcindex = {
    "en" : "0. The official Checkmk User Guide",
    "de" : "0. Das offizielle Checkmk Handbuch"
};

/*
 * Constants and variables for the update matrix
 */

var leftmargin = 310;
var topmargin = 100;
var hlmargin = 25;
var lheight = 34;
var gap = 20;
var canvaswidth = 800;
var arrowwidth = 15;
var font = "1em sans-serif";

var distros = { 'ubuntu' : [], }// 'debian' : [], 'sles' :   [], 'redhat'  : [] };

const withdrawn = [ '2.1.0p7', '2.1.0p23', '2.2.0p10', '2.2.0p13', '2.2.0p15' ];
const distroorder = [ 
    [ 'debian', 'squeeze'], [ 'debian', 'wheezy'], [ 'debian', 'jessie'], [ 'debian', 'stretch'], [ 'debian', 'buster'], [ 'debian', 'bullseye'], [ 'debian', 'bookworm'], 
    [ 'ubuntu', 'precise'], [ 'ubuntu', 'trusty'], [ 'ubuntu', 'xenial'], ['ubuntu', 'yakkety'], ['ubuntu', 'zesty'], ['ubuntu', 'artful'], ['ubuntu', 'bionic'], ['ubuntu', 'cosmic'], ['ubuntu', 'disco'], ['ubuntu', 'eoan'], ['ubuntu', 'focal'], ['ubuntu', 'groovy'], ['ubuntu', 'hirsute'], ['ubuntu', 'impish'], ['ubuntu', 'jammy'], ['ubuntu', 'kinetic'], ['ubuntu', 'lunar'], ['ubuntu', 'mantic'], ['ubuntu', 'noble'], 
    [ 'redhat', 'el5'], [ 'redhat', 'el6'], [ 'redhat', 'el7'], [ 'redhat', 'el8'], [ 'redhat', 'el9'], [ 'redhat', 'el10'], 
    [ 'sles', "sles11sp1"], [ 'sles', "sles11sp2"],[ 'sles', "sles11sp3"], [ 'sles', "sles11sp4"], [ 'sles', "sles12"], [ 'sles', "sles12sp1"], [ 'sles', "sles12sp2"],[ 'sles', "sles12sp3"], [ 'sles', "sles12sp4"], [ 'sles', "sles12sp5"], [ 'sles', "sles12sp6"], [ 'sles', "sles12sp7"], [ 'sles', "sles15"], [ 'sles', "sles15sp1"], [ 'sles', "sles15sp2"], [ 'sles', "sles15sp3"], [ 'sles', "sles15sp4"], [ 'sles', "sles15sp5"], [ 'sles', "sles15sp6"], [ 'sles', "sles15sp7"]
];

const nicenames = {
    'squeeze' : 'Debian 6 Squeeze',
    'wheezy' : 'Debian 7 Wheezy',
    'jessie' : 'Debian 8 Jessie',
    'stretch' : 'Debian 9 Stretch',
    'buster' : 'Debian 10 Buster',
    'bullseye' : 'Debian 11 Bullseye',
    'bookworm' : 'Debian 12 Bookworm',
    'precise' : 'Ubuntu 12.04 LTS Precise Pangolin',
    'trusty' : 'Ubuntu 14.04 LTS Trusty Tahr',
    'xenial' : 'Ubuntu 16.04 LTS Xenial Xerus',
    'yakkety' : 'Ubuntu 16.10 STS Yakkety Yak ',
    'zesty' : 'Ubuntu 17.04 STS Zesty Zapus',
    'artful' : 'Ubuntu 17.10 STS Artful Aardvark',
    'bionic' : 'Ubuntu 18.04 LTS Bionic Beaver',
    'cosmic' : 'Ubuntu 18.10 STS Cosmic Cuttlefish',
    'eoan' : 'Ubuntu 19.10 STS Eoan Ermine',
    'disco' : 'Ubuntu 19.04 STS Disco Dingo',
    'focal' : 'Ubuntu 20.04 LTS Focal Fossa',
    'groovy' : 'Ubuntu 20.10 STS Groovy Gorilla',
    'hirsute' : 'Ubuntu 21.04 STS Hirsute Hippo',
    'impish' : 'Ubuntu 21.10 STS Impish Indri',
    'jammy' : 'Ubuntu 22.04 LTS Jammy Jellyfish',
    'kinetic' : 'Ubuntu 22.10 STS Kinetic Kudu',
    'lunar' : 'Ubuntu 23.04 STS Lunar Lobster',
    'mantic' : 'Ubuntu 23.10 STS Mantic Minotaur',
    'noble' : 'Ubuntu 24.04 LTS Noble Numbat',
    'el5' : 'Red Hat Enterprise Linux 5',
    'el6' : 'Red Hat Enterprise Linux 6',
    'el7' : 'Red Hat Enterprise Linux 7',
    'el8' : 'Red Hat Enterprise Linux 8',
    'el9' : 'Red Hat Enterprise Linux 9',
    'el10' : 'Red Hat Enterprise Linux 10',
    "sles11sp1" : 'SUSE Linux Enterprise Server 11 SP1',
    "sles11sp2" : 'SUSE Linux Enterprise Server 11 SP2',
    "sles11sp3" : 'SUSE Linux Enterprise Server 11 SP3',
    "sles11sp4" : 'SUSE Linux Enterprise Server 11 SP4',
    "sles12" : 'SUSE Linux Enterprise Server 12',
    "sles12sp1" : 'SUSE Linux Enterprise Server 12 SP1',
    "sles12sp2" : 'SUSE Linux Enterprise Server 12 SP2',
    "sles12sp3" : 'SUSE Linux Enterprise Server 12 SP3',
    "sles12sp4" : 'SUSE Linux Enterprise Server 12 SP4',
    "sles12sp5" : 'SUSE Linux Enterprise Server 12 SP5',
    "sles12sp6" : 'SUSE Linux Enterprise Server 12 SP6',
    "sles12sp7" : 'SUSE Linux Enterprise Server 12 SP7',
    "sles15" : 'SUSE Linux Enterprise Server 15',
    "sles15sp1" : 'SUSE Linux Enterprise Server 15 SP1',
    "sles15sp2" : 'SUSE Linux Enterprise Server 15 SP2',
    "sles15sp3" : 'SUSE Linux Enterprise Server 15 SP3',
    "sles15sp4" : 'SUSE Linux Enterprise Server 15 SP4',
    "sles15sp5" : 'SUSE Linux Enterprise Server 15 SP5',
    "sles15sp6" : 'SUSE Linux Enterprise Server 15 SP6',
    "sles15sp7" : 'SUSE Linux Enterprise Server 15 SP7',
};
const releaseorder = [ "1.5.0", '1.6.0', '2.0.0', '2.1.0', '2.2.0', '2.3.0' ];
var ignoreminors = [];
var minors = { '2.2.0' : [],  '2.3.0' : [] }; // { '1.5.0' : [], '1.6.0' : [] };

// Used for the conference banner:
var lastKnownScrollPosition = 0;
var ticking = false;

// Add the event listener when the building of the DOM tree is finished.
// This allows for including this JS file in the head.
// Care for the order!
window.addEventListener ('load', function () {
    // Close stuff first
    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keypress', handleEsc);
    document.addEventListener('keydown', handleSlash);
    document.addEventListener('keypress', handleSlash);
    // Conference banner
    addConfBanner();
	//
	// Search related stuff
	// 
	var searchField = document.getElementsByClassName("header-top__search")[0];
	// Add an event listener to prevent bubbling
	searchField.addEventListener("click", handleClickOnSearch);
    searchField.addEventListener("submit", function(e) { e.preventDefault(); });
    //searchField.addEventListener("keypress", function(e) { e.preventDefault(); });
    if (window.location.pathname.match(/\/de\//)) {
		knwLang = "de";
	} else if (window.location.pathname.match(/\/en\//)) {
		knwLang = "en";
    }
    searchField.placeholder = locStrings["placeHolder"][knwLang];
	if (window.location.href.match(/\?/)) {
		getString = window.location.href.split('?')[1];
		searchParams= new URLSearchParams(getString); 
		// console.log(getString);
	}
	// iterate through the search params
	if (searchParams) {
		if (searchParams.has('find')) {
			var findstring = searchParams.get('find').replace(/\+/, ' ');
			if (searchParams.has('fulloverlay')) {
				console.log("Full overlay requested");
				openFullOverlay = 1;
			}
			if (searchParams.has('imlucky')) {
				console.log("Jump to results requested");
				iAmLucky = 1;
			}
			searchField.value = findstring;
			searchWhileType();
		}
	} else {
		// Only nag if no search overlay is requested
		nagOutdatedUsers();
	}
	if (knwDebug > 2) {
		console.log("Path: " + window.location.pathname);
		console.log("Search field contains: " + searchField.value);
		console.log("Search field place holder: " + searchField.placeholder);
	}
	// If the search field is filled because of reloading the page, show result:
	if (searchField.value.trim().length > 1) {
		searchWhileType();
	}
	// searchField.addEventListener('keyup', searchWhileType, false);
    // Keybindings
    searchField.addEventListener('keydown', runSearchKeys);
    searchField.addEventListener('keypress', runSearchKeys);
    searchField.addEventListener('keyup', handleKeyUps);
	// END search stuff
	//
	// Add ability to fold and unfold all subfolders in the navigation
	//
	menu = document.getElementsByClassName("main-nav__content")[0];
	subheaders = menu.getElementsByClassName("sect2");
	for (var i=0; i<subheaders.length; i++) {
		// The heading:
		var h = subheaders[i].getElementsByTagName("h3")[0];
		// connect an onClick handler to each heading:
		h.addEventListener('click', handleSubFolderClick, false);
		h.style.cursor = "pointer";
	}
	// Actually fold subfolders for better visibility on page load
	foldAllSiblings();
	// END fold stuff
	//
	// Add functions to show/hide the featured topic, only on startpage
	//
	try {
		featured = document.getElementById("morebutton");
		featured.addEventListener("click", function() { openFeatured(false); }, false);
		ytpreview = document.getElementById("ytbox");
		ytpreview.addEventListener("click", function() { openFeatured(true); }, false);
		opaque = document.getElementById("topicopaque");
		opaque.addEventListener("click", hideFeaturedTopic, false);
		topicoverlay = document.getElementById("topicshadow");
		topicoverlay.addEventListener("click", function(e) {
			e.stopPropagation();
		});
	} catch (error) {
		console.log("Caught: " + error);
	}
	// END new startpage
	//
	// Display glossary items as overlay box,
	// eliminating the need to click glossary links
	artcontent = document.getElementsByTagName("main")[0];
	var links = artcontent.getElementsByTagName("a");
	for (var i=0; i<links.length; i++) {
		// console.log(links[i].innerHTML);
		var href = links[i].getAttribute("href");
		if (href) {
			if (href.includes("glossar.html#", 0)) {
				links[i].addEventListener('mouseenter', mouseOverGlossary, false);
				links[i].addEventListener('mouseleave', waitOverlayClose, false);
				console.log("Add glossary overlay for: " + href);
			} else if (href.includes("://")) {
				console.log("Ignore protocol link: " + href);
			}
		} else {
			console.log("No href found!");
		}
	}
	// END glossary
	//
	// Draw the update matrix
	//
	drawUpdateMatrix();
	// END update matrix
	// 
	// Add anchors when following dropdowns
	//
	var dds = document.getElementsByClassName("dropdown-item");
	for (var i=0; i<dds.length; i++) {
		var tgt = dds[i].getAttribute("href");
		if (tgt.match(/^\//)) {
			dds[i].addEventListener("click", goToLinkWithAnchor);
		}
	}
	// 
	// END anchors
	// Any click removes  the search overlay - care for bubbling!
	document.getElementsByTagName("body")[0].addEventListener("click", function() { removeSearchOverlay(); });
});

window.onresize = function() {
    drawUpdateMatrix();
    resizeYtVideo();
}

screen.orientation.addEventListener("change", (event) => {
    drawUpdateMatrix();
    resizeYtVideo();
});

/*
 * Search related stuff
 *
 */

// Keybindings
function runSearchKeys(e) {
    if (e.key == "ArrowDown") {
        var morebox = document.getElementsByClassName("header-top__search__results__more")[0];
        var overlay = document.getElementById("searchOverlay");
        if (morebox || overlay) {
            moveInOverlay(1);
        } else {
            searchWhileType();
        }
        e.preventDefault();
    } else if (e.key == "ArrowUp") {
        moveInOverlay(-1);
        e.preventDefault();
    } else if (e.key == "Enter") {
        if (selectedResult < 0) {
            searchWhileType();
        } else {
            openLinkFromSearch();
        }
        e.preventDefault();
    } else {
        // searchWhileType();
    }
}

function handleKeyUps(e) {
    if (e.key == "Escape") {
        // 
    } else if (e.key == "ArrowDown") {
        e.preventDefault();
    } else if (e.key == "ArrowUp") {
        e.preventDefault();
    } else if (e.key == "Enter") {
        e.preventDefault();
    } else {
        searchWhileType();
    }
}

function handleEsc(e) {
    if (e.key == "Escape") {
        removeSearchOverlay();
        removeGlossary();
        closeNagscreen();
    }
}

function handleSlash(e) {
    if (e.code == "Slash") {
        var searchField = document.getElementsByClassName("header-top__search")[0];
        try {
            if (searchField == document.activeElement) {
                return true;
            }
        } catch(error) {
            console.log("No active element.");
        }
        e.preventDefault();
        removeSearchOverlay();
        searchField.focus();
    }
}

// Properly handle mouse clicks on the search field
function handleClickOnSearch(e) {
	e.stopPropagation();
	searchWhileType();
}

// Call while typing. This checks a semaphore, extracts the search string, 
// identifies the box to connect a decides what to call next. 
function searchWhileType() {
	if (domBlocked > 0) {
		if (knwDebug > 1) {
			console.log("DOM is blocked!");
		}
		return;
	}
	domBlocked = 1;
	var searchField = document.getElementsByClassName("header-top__search")[0];
	var rawInput = searchField.value;
	// var trimmedInput = rawInput.trim();
	if (rawInput != lastSearchString) {
        selectedResult = -1;
		if (knwDebug > 2) {
			console.log(rawInput);
		}
		lastSearchString = rawInput;
		if (rawInput.length > 1) {
			searchLunr(rawInput);
		} else {
			var tgt = LUNR_CONFIG["previewResultsClassName"];
			removeAllChildren(document.getElementsByClassName(tgt)[0]);
		}
	}
	// Check whether the input has changed again:
	rawInput = searchField.value;
	domBlocked = 0;
	// It has changed? Recursively call this function to catch up:
	if (rawInput != lastSearchString) {
		searchWhileType();
	}
}

// Search lunr and call the update of the DOM tree from there:
function searchLunr(query) {
	var rawquery = query;
	var results;
	var wildresults; // results for wildcard search
	if (query.length < 3 || query.slice(-1) == " ") {
		console.log("Either 2 chars or last char is space, not appending asterisk");
	} else {
		console.log("Appending asterisk");
		query = query + '*';
	}
	try {
		var idx = lunr.Index.load(LUNR_DATA);
		wildresults = idx.search(query);
		results = idx.search(rawquery);
		if (wildresults.length > results.length) {
			results = wildresults;
		}
	} catch (e) {
		console.log("LUNR exception on query: " + query);
		console.log("Exception: " + e);
		return;
	}
	var count = results.length;
	cachedSearchResults = results;
	console.log(count);
	// var resultHtml = parseLunrResults(results);
	var prevCont = LUNR_CONFIG["previewResultsClassName"];
	// Only use with prefilled search field!
	if (searchParams) {
		if (iAmLucky > 0 && results.length > 0) {
			var id = results[0]["ref"];
			var item = PREVIEW_LOOKUP[id];
			var newurl = "";
			if (window.location.pathname.match(/\/$/)) {
				newurl = window.location.protocol + "//" + window.location.hostname + window.location.pathname + item["l"] + "?lquery=" + encodeURI(query);
			} else {
				var ptoks = window.location.pathname.split("/").slice(0,-1);
				newurl = window.location.protocol + "//" + window.location.hostname + ptoks.join("/") + "/" + item["l"] + "?lquery=" + encodeURI(query);
			}
			window.location.replace(newurl);
		}
	}
	// Otherwise show the DOM element
	// document.getElementsByClassName(prevCont)[0].innerHTML = resultHtml;
	// Move to full overlay if requested
	if (openFullOverlay > 0 && results.length > 0) {
		openFullOverlay = 0;
		showFullList();
	} else {
		console.log("Appending preview…");
		appendPreviewDom(results, document.getElementsByClassName(prevCont)[0], rawquery);
	}
}

// FIXME: Highlight the search words

// Create a DOM subtree for the preview results and attach to the parent node
// given. 
function appendPreviewDom(results, node, query) {
	removeAllChildren(node);
	// We didn't find any result for 'sdgftasdgasdg'. Sorry!
	if (results.length < 1) {
		var p = document.createElement("p");
		var t = locStrings["nothingFound"][knwLang].replace("QUERY", query);
		p.setAttribute("class", "header-top__search__results__noresult");
		var a = document.createElement("a");
		a.setAttribute("href", "./search.html");
		a.setAttribute("class", "header-top__search__results__more");
		a.appendChild(document.createTextNode(t));
		p.appendChild(a);
		// p.onclick = function() { window.location.replace("./search.html"); console.log("clicked"); };
		node.appendChild(p);
	}
	for (var i = 0; i < results.length; i++) {
		var id = results[i]["ref"];
		var item = PREVIEW_LOOKUP[id]
		var outer = document.createElement("a");
        var bc = retrieveBreadCrumb(item["l"]);
		outer.setAttribute("class", "header-top__search__results__result");
		outer.setAttribute("href", item["l"] + "?lquery=" + encodeURI(query));
		var title = document.createElement("div");
		title.setAttribute("class", "header-top__search__results__result__title");
		title.appendChild(document.createTextNode(item["t"]));
        var breadcrumb = document.createElement("div");
        breadcrumb.setAttribute("class", "header-top__search__results__breadcrumb");
        breadcrumb.appendChild(document.createTextNode(bc));
		var desc = document.createElement("div");
		desc.setAttribute("class", "header-top__search__results__result__description");
		desc.appendChild(document.createTextNode(item["p"]));
		if (i < 5) {
            outer.appendChild(breadcrumb);
			outer.appendChild(title);
            // outer.appendChild(breadcrumb);
			outer.appendChild(desc);
			node.appendChild(outer);
		}
	}	 
	if (results.length > 5) {
		var outer = document.createElement("a");
		outer.setAttribute("class", "header-top__search__results__more");
		var t = locStrings["viewAll"][knwLang];
		t = t.replace("NUMBER", results.length);
		t = t.replace("QUERY", query);
		var s = document.createElement("span");
		s.setAttribute("class", "header-top__search__results__query");
		s.appendChild(document.createTextNode(t));
		outer.appendChild(s);
		var h = document.createElement("span");
		h.setAttribute("class", "header-top__search__results__query");
		h.appendChild(document.createTextNode(" – " + locStrings["searchHelp"][knwLang] ));
		outer.appendChild(h);
		node.appendChild(outer);
		s.addEventListener('click', showFullList, false);
		h.onclick = function() { window.location.replace("./search.html"); }; 
	} else if  (results.length > 0) {
		var outer = document.createElement("a");
		outer.setAttribute("class", "header-top__search__results__more");
		var h = document.createElement("span");
		h.setAttribute("class", "header-top__search__results__query");
		h.appendChild(document.createTextNode(locStrings["searchHelp"][knwLang] ));
		outer.appendChild(h);
		node.appendChild(outer);
		h.onclick = function() { window.location.replace("./search.html"); }; 
	}
}

function retrieveBreadCrumb(fname) {
    if (fname in breadcrumbs) return breadcrumbs[fname];
    if (fname == "index.html") return bcindex[knwLang];
    var mainNav = document.getElementsByClassName("main-nav__content")[0];
    var h2s = mainNav.getElementsByTagName("h2");
    for (var i = 0; i < h2s.length; i++) {
        var links = [];
        var nxt = h2s[i].nextSibling;
        if (nxt.nodeName == "#text") nxt = nxt.nextSibling;
        var h3s = nxt.getElementsByTagName("h3");
        for (var k = 0; k < h3s.length; k++) {
            nxt = h3s[k].nextSibling;
            if (nxt.nodeName == "#text") nxt = nxt.nextSibling;
            links = nxt.getElementsByTagName("a");
            for (var j = 0; j < links.length; j++) {
                if (fname == links[j].getAttribute("href")) {
                    var bc = h2s[i].innerText.trim() + " > " +  h3s[k].innerText.trim() + " > " + links[j].innerText.trim();
                    breadcrumbs[fname] = bc;
                    console.log(bc);
                    return(bc);
                }
            }
        }
        nxt = h2s[i].nextSibling;
        if (nxt.nodeName == "#text") nxt = nxt.nextSibling;
        links = nxt.getElementsByTagName("a");
        for (var j = 0; j < links.length; j++) {
            if (fname == links[j].getAttribute("href")) {
                var bc = h2s[i].innerText.trim() + " > " + links[j].innerText.trim();
                breadcrumbs[fname] = bc;
                console.log(bc);
                return(bc);
            }
        }
    }
    var bc = bcnotfound[knwLang];
    breadcrumbs[fname] = bc;
    return(bc);
}

// Create a list of all search results and append it to the existing DOM tree.
function showFullList(e) {
	e.stopPropagation();
	var searchField = document.getElementsByClassName("header-top__search")[0];
	var rawInput = searchField.value;
	removeAllChildren(document.getElementsByClassName(LUNR_CONFIG["previewResultsClassName"])[0]);
	var list = createSearchOverlay();
	appendFullList(cachedSearchResults, list, rawInput);
}

// Auxiliary function:
// Remove all children from a given parent node…
function removeAllChildren(node) {
	if (node.childNodes) { var children = node.childNodes; }
	for (var i = children.length - 1; i >= 0; i--) {
		node.removeChild(children[i]);
	}
}

// Auxiliary function:
// Remove the (old) search overlay, the index of the shadow is guessed, we
// hope that our search overlay creates the last shadow in the tree. 
function removeSearchOverlay() {
	console.log('Trying to remove search overlay.');
	var overlay = document.getElementById("searchOverlay");
	var shortlist = document.getElementsByClassName("header-top__search__results")[0];
	var shadow = document.getElementsByClassName("modal-backdrop"); 
	if (overlay) {
		document.getElementsByTagName("body")[0].removeChild(overlay);
	}
	if (shortlist) {
		removeAllChildren(document.getElementsByClassName(LUNR_CONFIG["previewResultsClassName"])[0]);
	}
	if (shadow.length > 0) {
		document.getElementsByTagName("body")[0].removeChild(shadow[shadow.length - 1]);
	}
	domBlocked = 0;
	lastSearchString = '';
    selectedResult = -1;
}

// Auxiliary function:
// Create a empty DOM subtree contained in one node.
// This subtree…
//   1. has to be filled with the search results
//   2. has to be connected to the appropriate parent node
function createSearchOverlay() {
	var overlay = document.createElement("div");
	overlay.setAttribute("id", "searchOverlay");
	overlay.setAttribute("class", "modal show");
	overlay.setAttribute("tabindex", "-1");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("role", "dialog");
	var dia = document.createElement("div");
	dia.setAttribute("class", "search-modal modal-dialog");
	dia.setAttribute("role", "document");
	overlay.appendChild(dia);
	var cont = document.createElement("div");
	cont.setAttribute("class", "modal-content");
	dia.appendChild(cont);
	var head = document.createElement("div");
	head.setAttribute("class", "modal-header");
	cont.appendChild(head);
	var title = document.createElement("h5");
	title.setAttribute("class", "modal-title");
	var t = locStrings["listHead"][knwLang].replace("QUERY", lastSearchString);
	title.appendChild(document.createTextNode(t));
	head.appendChild(title);
	var button = document.createElement("button");
	button.setAttribute("class", "close");
	button.setAttribute("type", "button");
	button.setAttribute("data-dismiss", "modal");
	button.setAttribute("aria-label", "Close");
	button.addEventListener('click', removeSearchOverlay, false);
	head.appendChild(button);
	var x = document.createElement("span");
	x.setAttribute("aria-hidden", "true");
	x.appendChild(document.createTextNode("x"));
	button.appendChild(x);
	var list = document.createElement("div");
	list.setAttribute("class", "search-modal__results modal-body");
	cont.appendChild(list);
	// Create shadow
	var shadow = document.createElement("div"); 
	shadow.setAttribute("class", "modal-backdrop show");
	// Append shadow and modal box
	var body = document.getElementsByTagName("body")[0];
	body.appendChild(overlay);
	overlay.style.display = "block"; 
	body.appendChild(shadow);
    overlay.addEventListener("click", (event) => { doNotBubble(event); });
    overlay.addEventListener('keydown', runSearchKeys);
    overlay.addEventListener('keypress', runSearchKeys);
	return list;
}

function moveInOverlay(step) {
    var overlay = document.getElementsByClassName("header-top__search__results")[0];
    var newSelection = step + selectedResult;
    // No overlay found. Something is fishy.
    if (!overlay) {
        return true;
    }
    // Already outside the list.
    if (newSelection < -1) {
        return true;
    }
    var results = overlay.getElementsByClassName("header-top__search__results__result");
    var morebox = document.getElementsByClassName("header-top__search__results__more")[0];
    // We are probably in the full overlay.
    if (!morebox) {
        return moveInFullOverlay(step);
    }
    console.log("Moving to: " + newSelection);
    var morelinks = morebox.getElementsByClassName("header-top__search__results__query");
    console.log("Results found: " + results.length);
    // Clear the first entry when moving up.
    if (newSelection < 0) {
        results[0].style = "";
        selectedResult = newSelection;
        return true;
    }
    // Do not move beyond the end of the list.
    if (newSelection - 1 > results.length) {
        return true;
    }
    // No view all link because the list is 5 or less entries.
    if (newSelection > results.length && morelinks.length < 2) {
        return true;
    }
    selectedResult = newSelection;
    for (var i=0; i<results.length; i++) {
        if (i == selectedResult) {
            results[i].style.backgroundColor = highlightEntry;
        } else {
            results[i].style = "";
        }
    }
    if (selectedResult >= results.length) {
        // No results?
        if (results.length < 1) {
            morelinks = document.getElementsByClassName("header-top__search__results__noresult");
        }
        if (selectedResult == results.length) {
            morelinks[0].style.backgroundColor = highlightEntry;
            if (morelinks.length > 1) { morelinks[1].style = ""; }
        } else {
            morelinks[1].style.backgroundColor = highlightEntry;
            morelinks[0].style = "";
        }
    } else {
        morelinks[0].style = "";
        if (morelinks.length > 1) { morelinks[1].style = ""; }
    }
    return false;
}

function moveInFullOverlay(step) {
    var overlay = document.getElementById("searchOverlay");
    var newSelection = step + selectedResult;
    console.log("Moving to: " + newSelection);
    if (!overlay) {
        console.log("No overlay found.");
        return true;
    }
    if (newSelection < -1) {
        return true;
    }
    var results = overlay.getElementsByClassName("search-modal__results__result");
    console.log("Results found: " + results.length);
    if (newSelection < 0) {
        results[0].style = "";
        selectedResult = newSelection;
        return true;
    }
    if (newSelection + 1 > results.length) {
        return true;
    }
    selectedResult = newSelection;
    for (var i=0; i<results.length; i++) {
        if (i == selectedResult) {
            results[i].style.backgroundColor = highlightEntry;
            results[i].scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        } else {
            results[i].style = "";
        }
    }
    return false;
}
    
function openLinkFromSearch() {
    var fullOverlay = document.getElementById("searchOverlay");
    if (fullOverlay) {
        return openLinkFromFullSearch();
    }
    if (selectedResult < 0) {
        return true;
    }
    var overlay = document.getElementsByClassName("header-top__search__results")[0];
    if (!overlay) {
        console.log("No overlay found.");
        return true;
    }
    var results = overlay.getElementsByClassName("header-top__search__results__result");
    var morebox = document.getElementsByClassName("header-top__search__results__more")[0];
    var morelinks = morebox.getElementsByClassName("header-top__search__results__query");
    if (selectedResult >= results.length) {
        // No results?
        if (results.length < 1) {
            window.location.href = "search.html";
            return false;
        } else if (selectedResult == results.length && morelinks.length > 1) {
            var query = lastSearchString; // cache it, it will be cleared
            removeSearchOverlay();
            lastSearchString = query;
            var list = createSearchOverlay();
            appendFullList(cachedSearchResults, list, query);
            // moveInOverlay(6);
            return false;
        } else {
            window.location.href = "search.html";
            return false;
        }
    }
    var tgt = results[selectedResult].getAttribute("href");
    window.location.href = tgt;
}

function openLinkFromFullSearch() {
    var fullOverlay = document.getElementById("searchOverlay");
    if (!fullOverlay) {
        console.log("No overlay found.");
        return true;
    }
    if (selectedResult < 0) {
        return true;
    }
    var results = fullOverlay.getElementsByClassName("search-modal__results__result");
    if (selectedResult > results.length) {
      return true;
    }
    var tgt = results[selectedResult].getElementsByClassName("search-modal__results__result__title")[0].getAttribute("href");
    window.location.href = tgt;
}

// Auxiliary function:
// Takes a list of search results and a parent node and attaches each
// of the result to the parent.
function appendFullList(results, node, query) {
    console.log("Query string is: " + query);
	removeAllChildren(node);
	for (var i = 0; i < results.length; i++) {
		var id = results[i]["ref"];
		var item = PREVIEW_LOOKUP[id];
        var bc = retrieveBreadCrumb(item["l"]);
		var outer = document.createElement("div");
		outer.setAttribute("class", "search-modal__results__result");
		var link = document.createElement("a");
		link.setAttribute("class", "search-modal__results__result__title");
		link.setAttribute("href", item["l"] + "?lquery=" + encodeURI(query));
		link.appendChild(document.createTextNode(item["t"])); 
        var breadcrumb = document.createElement("div");
        breadcrumb.setAttribute("class", "header-top__search__results__breadcrumb");
        breadcrumb.appendChild(document.createTextNode(bc));
		var desc = document.createElement("div");
		desc.setAttribute("class", "search-modal__search__results__result__description");
		desc.appendChild(document.createTextNode(item["p"]));
        outer.appendChild(breadcrumb);
		outer.appendChild(link);
		outer.appendChild(desc);
		node.appendChild(outer);
	}	 
}	

/*

This block is for nagging users that visit old versions of the docs. They get an overlay showing
when the version they are visiting got out of support and a link pointing to the most recent
version of the docs.

This appears only when external links, bookmarks etc. are used, when the referrer is in the realm
of our servers, no nag screen is shown.

*/
function nagOutdatedUsers() {
	var ref = document.referrer;
	var path = window.location.pathname;
	var ptoks = path.split("/");
	if (ref.length > 0) {
		var rtoks = ref.split("/");
		if (rtoks[2] == "docs.checkmk.com" || rtoks[2] == "docs.dev.tribe29.com") {
			console.log("Followed internal link, that's always OK.");
			return 0;
		}
	}
	for (var i=0; i<oldVersions.length; i++) {
		if (ptoks[1] == oldVersions[i]) {
			var body = document.getElementsByTagName("body")[0];
			var nagouter = document.createElement("div");
			nagouter.setAttribute("id", "nagolddocsouter");
			body.appendChild(nagouter);
			nagouter.innerHTML = nagStrings[ptoks[1]][ptoks[2]]; 
			return 0;
		}
	}
	
}

// Create a link pointing to the latest version of this article and jump to it.
function switchToLatest() {
	var path = window.location.pathname;
	var ptoks = path.split("/");
	var url = "https://docs.checkmk.com/";
	if (window.location.hostname == "docs.dev.tribe29.com") {
		url = "http://docs.dev.tribe29.com/";
	}
	url = url + "latest/" + ptoks[2] + "/" + ptoks[3] + "?redirect=outdated";
	window.location.replace(url);
}

// Close the nag screen.
function closeNagscreen() {
    var nagscreen = document.getElementById("nagolddocsouter");
    if (nagscreen) {
        nagscreen.style.display = "none";
    }
}

//
// Functions for folding submenu entries
//

// Collapse yourself when clicked
function handleSubFolderClick() {
	var list = this.parentNode.getElementsByTagName("ul")[0];
	if (list.style.display == "none") {
		list.style.display = "block";
	} else {
		list.style.display = "none";
	}
}

// In deeply nested menues, collapse all siblings.
// This should be called on load.
function foldAllSiblings() {
	for (var i=0; i<subheaders.length; i++) {
		var h3 = subheaders[i].getElementsByTagName("h3")[0];
		console.log(h3.getAttribute("id"));
		// Now find the selected item
		var items = subheaders[i].getElementsByClassName("selected");
		if (items.length < 1) {
			// console.log("Found: " + items[0]);
			var list = h3.parentNode.getElementsByTagName("ul")[0];
			// list.style.display = "none";
		} else {
			// work around an alleged bug setting classes for h2
			subheaders[i].parentNode.parentNode.getElementsByTagName("h2")[0].className += " open";
		}
	}
}

/*
The new startpage adds an overlay that covers the main area without blocking search.
Opening not only switches visibility but also adds the iframe for YouTube.
This means no data is transfered to YouTube until the overlay is opened.
*/

function openFeatured(autoplay) {
	console.log("Clicked on featured"); 
	// We have to add the iframe if not already present
	var container = document.getElementById("videocontainer");
	var iframes = container.getElementsByTagName("iframe");
	if (iframes.length < 1) {
		var a = container.getElementsByTagName("a")[0];
		var link = a.getAttribute("href");
		if (autoplay == true) {
			link = link + "?autoplay=1";
		}
		var title = a.getAttribute("title");
		var iframe = document.createElement("iframe");
		container.removeChild(a);
		// iframe.setAttribute("width", "400");
		// iframe.setAttribute("height", "225");
		iframe.setAttribute("frameborder", "0");
		iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
		iframe.setAttribute("allowfullscreen", "true");
		iframe.setAttribute("src", link);
		iframe.setAttribute("title", title);
        iframe.setAttribute("id", "ytiframe");
		container.appendChild(iframe);
	}
	document.getElementById("topicopaque").style.display = "block";
    resizeYtVideo();
	return false;
}

function hideFeaturedTopic() {
	document.getElementById("topicopaque").style.display = "none";
	return false;
}

// Call this to adjust the size of the YT video
function resizeYtVideo() {
    var f = document.getElementById("ytiframe");
    if (f) {
        var c = document.getElementById("videocontainer");
        var w = c.offsetWidth;
        var h = w * 9 / 16;
        f.style.width = w + "px";
        f.style.height = Math.ceil(h) + "px";
        c.style.height = Math.ceil(h) + "px";
        f.setAttribute("width", w);
        f.setAttribute("height", Math.ceil(h));
        c.setAttribute("height", Math.ceil(h));
    }
}

// Auxiliary function:
// This can be called from links to add the search overlay without reloading the page.
// Used on the start page to display "most searched" links.
function openTheSearch(txt) {
	console.log(txt);
	var searchField = document.getElementsByClassName("header-top__search")[0];
	searchField.value = txt;
	searchWhileType();
	showFullList();
	return false;
}

/*
Change from needing to click glossary links to glossary overlays.
This loads the whole glossary in the background, extracts the relevant section and
displays it in an overlay box.
*/

function removeGlossary() {
	var box = document.getElementById("glossary_overlay");
	if (box) {
		box.remove();
	}
	try {
		clearTimeout(tout);
		console.log("Cleared timeout: " + tout);
	} catch (e) {
		console.log("No timeout to clear.");
	}
	entered_overlay = 0;
}

function mightCloseGlossary() {
	if (entered_overlay < 1) {
		removeGlossary();
		console.log("Removed box after given timeout.");
	}
}

function waitOverlayClose() {
	var entry = this.getAttribute("href");
	console.log("Leaving link: " + entry);
	var box = document.getElementById("glossary_overlay");
	if (box) {
		tout = setTimeout(mightCloseGlossary, 500);
	}
}

function enterOverlayBox() {
	entered_overlay = 1;
	console.log("Entered overlay: " + entered_overlay);
}

function exitOverlayBox() {
	// removeGlossary();
	removeGlossary();
	entered_overlay = 0;
	console.log("Exited overlay: " + entered_overlay);
}

function mouseOverGlossary(event) {
	try {
		clearTimeout(tout);
		console.log("Cleared timeout: " + tout);
	} catch (e) {
		console.log("No timeout to clear.");
	}
	var ptoks = window.location.pathname.split("/");
	var entry = this.getAttribute("href").split("#")[1];
	var x = event.clientX;
	var y = event.clientY;
	// console.log(entry);
	if (entry in glossary_cont) {
		displayGlossary(glossary_cont[entry], x, y)
	} else {
		console.log("Searching glossary for " + entry);
		var xhr = new XMLHttpRequest();
		// var j;
		// xhr.open('GET', "/glossary/" + ptoks[2] + "/" + entry, true);
		// xhr.overrideMimeType("text/plain; charset=utf8");
		// xhr.responseType = 'json';
		xhr.open('GET', "./glossar.html", true);
		xhr.overrideMimeType("text/html; charset=utf8");
		xhr.responseType = 'document';
		xhr.onload = function() {
			if (xhr.status === 200) {
				fillGlossary(xhr.responseXML);
				displayGlossary(glossary_cont[entry], x, y)
				// displayGlossary(xhr.response, event.clientX, event.clientY);
			}
		}
		xhr.send();
	}
}

function fillGlossary(html) {
	// var frag = new DocumentFragment();
	// frag.append(html.body);
	console.log(html);
	var entries = html.body.getElementsByClassName("sect3");
	for (var i=0; i<entries.length; i++) {
		var content = entries[i];
		var key = content.getElementsByTagName("span")[0].getAttribute("id");
		console.log(key);
		console.log(content.innerHTML);
		glossary_cont[key] = content.innerHTML;
	}
}

function displayGlossary(html, x, y) {
	// Remove a window if it exists
	removeGlossary();
	var winwidth = window.innerWidth;
	var winheight = window.innerHeight;
	var box = document.createElement("div");
	box.setAttribute("id", "glossary_overlay");
	box.innerHTML = html;
	artcontent.appendChild(box);
	box.style.display = "block";
	console.log("Mouse position, x: " + x + ", y: " + y);
	var boxwidth = box.clientWidth;
	var boxheight = box.clientHeight;
	// Check whether we are left or right from the center
	if (x > winwidth / 2) { // right
		box.style.left = (x - boxwidth) + "px";
	} else { // left
		box.style.left = x + "px";
	}
	// Check whether we are higher or lower than the center
	if (y > winheight / 2) { // lower
		box.style.top = (y - boxheight - 10) + "px";
	} else { // higher
		box.style.top = (y + 10) + "px";
	}
	// Add enter event listener for the box
	box.addEventListener('mouseenter', enterOverlayBox, false);
	box.addEventListener('mouseleave', exitOverlayBox, false);
}

/*
 * Paint the version matrix on a canvas
 */

function drawUpdateMatrix() {
    var d = [ 'debian', 'redhat', 'sles', 'ubuntu' ];
    canvaswidth = Math.min(document.getElementsByTagName("main")[0].getElementsByClassName("paragraph")[0].scrollWidth - 55, 745);
    if (canvaswidth < 450) {
	leftmargin = 190;
	topmargin = 60;
	hlmargin = 15;
	lheight = 19;
	gap = 12;
	arrowwidth = 9;
	font = "0.7em sans-serif";   
    }
    var needed = [];
    for (var i=0; i<d.length; i++) {
        var c = document.getElementById('matrix_' + d[i]);
        if (c) {
            // console.log('Found matrix_' + d[i]);
            needed.push(d[i]);
        }
    }
    if (needed.length < 1) {
        return true;
    }
    console.log("Canvaswidth: " + canvaswidth);
    
    /*
    fetch("/assets/js/supported_builds_clean.json")
        .then((res) => res.json())
        .then((data) => {
            var ptoks = window.location.pathname.split("/");
            console.log('On branch: ' + ptoks[1]);
            if (releaseorder.includes(ptoks[1])) {
                var pos = releaseorder.indexOf(ptoks[1]);
                minors = {};
                minors[releaseorder[pos-1]] = [];
                minors[releaseorder[pos]] = [];
            }
            for (var i=0; i<needed.length; i++) {
                distros = {};
                distros[needed[i]] = [];
                ignoreminors = [];
                fillTable(data);
                fixDistroOrder(data);
                var activeDistros = getActiveDistros(data);
                var box = document.getElementById("matrix_" + needed[i]);
                try {
			box.getElementsByTagName('p')[0].remove();
		} catch (e) {}
		try {
			box.getElementsByTagName('canvas')[0].remove();
		} catch (e) {}
                var canvas = document.createElement('canvas');
                box.appendChild(canvas);
		box.style.width = '100%';
                canvas.setAttribute("height", topmargin + hlmargin + lheight * activeDistros.length + lheight);
                canvas.setAttribute("width", canvaswidth + Object.keys(minors).length * gap);
		canvas.style.marginRight = 'auto';
		canvas.style.marginLeft = 'auto';
		canvas.style.display = 'block';
                var ctx = canvas.getContext("2d");
                drawDistroLabels(ctx, activeDistros);
                var neededCols = getColumns(data);
                drawGreenBoxes(data, ctx, activeDistros, neededCols);
                drawLines(ctx, activeDistros, neededCols);
                drawLabels(ctx, activeDistros, neededCols);
            }
            reloadAnchor();
        });
        */
    if (matrixdata) {
        var ptoks = window.location.pathname.split("/");
            console.log('On branch: ' + ptoks[1]);
            if (releaseorder.includes(ptoks[1])) {
                var pos = releaseorder.indexOf(ptoks[1]);
                minors = {};
                minors[releaseorder[pos-1]] = [];
                minors[releaseorder[pos]] = [];
            }
            for (var i=0; i<needed.length; i++) {
                distros = {};
                distros[needed[i]] = [];
                ignoreminors = [];
                fillTable(matrixdata);
                fixDistroOrder(matrixdata);
                var activeDistros = getActiveDistros(matrixdata);
                var box = document.getElementById("matrix_" + needed[i]);
                try {
			box.getElementsByTagName('p')[0].remove();
		} catch (e) {}
		try {
			box.getElementsByTagName('canvas')[0].remove();
		} catch (e) {}
                var canvas = document.createElement('canvas');
                box.appendChild(canvas);
		box.style.width = '100%';
                canvas.setAttribute("height", topmargin + hlmargin + lheight * activeDistros.length + lheight);
                canvas.setAttribute("width", canvaswidth + Object.keys(minors).length * gap);
		canvas.style.marginRight = 'auto';
		canvas.style.marginLeft = 'auto';
		canvas.style.display = 'block';
                var ctx = canvas.getContext("2d");
                drawDistroLabels(ctx, activeDistros);
                var neededCols = getColumns(matrixdata);
                drawGreenBoxes(matrixdata, ctx, activeDistros, neededCols);
                drawLines(ctx, activeDistros, neededCols);
                drawLabels(ctx, activeDistros, neededCols);
            }
            reloadAnchor();
    }
}

// Fill only the in memory table for the requested distributions:
function fillTable(j) {
    console.log(j);
    var k = Object.keys(minors);
    console.log(k);
    for (var i=0; i<k.length; i++) {
        // console.log(minors[k[i]]);
        // h['cre'][m].keys.reverse.each { |k|
        var n = Object.keys(j['cre'][k[i]]);
        for (var m=n.length-1; m>=0; m--) {
            // console.log(n[m]);
            if (!minors[k[i]].includes(n[m]) && !withdrawn.includes(n[m]) ) {
                minors[k[i]].push(n[m]);
            }
            var dnames = Object.keys(distros);
            for (var o=0; o<dnames.length; o++) {
                var p = Object.keys(j['cre'][k[i]][n[m]][dnames[o]]);
                // console.log(p);
                for (var q=0; q<p.length; q++) {
                    if (j['cre'][k[i]][n[m]][dnames[o]][p[q]] == 'supported' && !distros[dnames[o]].includes(p[q])) {
                        distros[dnames[o]].push(p[q]);
                    }
                }
            }
        }
    }
}

// Retrieve the active distros for the release and distro range specified above
function getActiveDistros(j) {
    var drawn = [];
    for (var n=0; n<distroorder.length; n++) {
        var dnames = Object.keys(distros);
        if (dnames.includes(distroorder[n][0])) {
            // console.log(distroorder[n][1]);
            for (var m=0; m<releaseorder.length; m++) {
                // console.log(releaseorder[m]);
                if (releaseorder[m] in minors) {
                    // console.log(releaseorder[m]);
                    for (var o=0; o<minors[releaseorder[m]].length; o++) {
                        // console.log(minors[releaseorder[m]][o]);
                        if (!ignoreminors.includes(minors[releaseorder[m]][o])) {
                            var s = j['cre'][releaseorder[m]][minors[releaseorder[m]][o]][distroorder[n][0]][distroorder[n][1]];
                            if (s == "supported" && !drawn.includes(distroorder[n][1])) {
                                // console.log(distroorder[n][1]);
                                drawn.push(distroorder[n][1]);
                            }
                        }
                    }
                }
            }
        }
    }
    return drawn;
    // canvas.setAttribute("height", topmargin + hlmargin + lheight * drawn.length + lheight);
}

function fixDistroOrder(j) {
    var codenames = [];
    for (var n=0; n<distroorder.length; n++) {
        codenames.push(distroorder[n][1]);
    }
    var cmkMaj = Object.keys(minors);
    for (var i=0; i<cmkMaj.length; i++) {
        var cmkMin = Object.keys(j['cre'][cmkMaj[i]]);
        for (var n=cmkMin.length-1; n>=0; n--) {
            var distroFam = Object.keys(distros);
            for (var k=0; k<distroFam.length; k++) {
                var distroCode = Object.keys(j['cre'][cmkMaj[i]][cmkMin[n]][distroFam[k]]);
                for (var m=0; m<distroCode.length; m++) {
                    // console.log(distroCode[m]);
                    if (!codenames.includes(distroCode[m])) {
                        // console.log("Missing distro found: " + distroCode[m]);
                        codenames.push(distroCode[m]);
                        distroorder.push([distroFam[k], distroCode[m]]);
                    }
                }                    
            }
        }
    }
}

function getColumns(j) {
    var neededLabels = {};
    var majors = Object.keys(minors);
    for (var i=0; i<majors.length; i++) {
        neededLabels[majors[i]] = [];
    }
    for (var m=0; m<releaseorder.length; m++) {
        var lastCol = [];
        if (releaseorder[m] in minors) {
            for (var o=0; o<minors[releaseorder[m]].length; o++) {
                var thiscolumn = [];
                for (var n=0; n<distroorder.length; n++) {
                    if (distroorder[n][0] in distros) {
                        var s = j['cre'][releaseorder[m]][minors[releaseorder[m]][o]][distroorder[n][0]];
                        if (distroorder[n][1] in s && s[distroorder[n][1]] == 'supported') {
                            thiscolumn.push('supported');
                        } else {
                            thiscolumn.push('');
                        }
                    }
                }
                // console.log(thiscolumn);
                // console.log(minors[releaseorder[m]]);
                if (!withdrawn.includes(minors[releaseorder[m]][o])) {
                    if (JSON.stringify(thiscolumn) == JSON.stringify(lastCol)) {
                        // console.log('no change');
                        // console.log(minors[releaseorder[m]][o]);
                        // console.log(minors[releaseorder[m]]);
                        ignoreminors.push(minors[releaseorder[m]][o]);
                    } else {
                        // console.log(minors[releaseorder[m]][o]);
                        neededLabels[releaseorder[m]].push(minors[releaseorder[m]][o]);
                    }
                }
                lastCol = thiscolumn;
            }
        }
    }
    return neededLabels;
}

function drawDistroLabels(ctx, activeDistros) {
    ctx.font = font;
    ctx.textAlign = "right";
    for (var n=0; n<activeDistros.length; n++) {
        var nname = "Codename not found: " + activeDistros[n];
        ctx.fillStyle = "#ff0000";
        if (activeDistros[n] in nicenames) {
            ctx.fillStyle = "#000000";
            nname = nicenames[activeDistros[n]];
        }
        ctx.fillText(nname, leftmargin, topmargin + hlmargin + lheight * n);
    }
}

function calculateColWidth(activeDistros, neededLabels) {
    var colwidth = 0;
    var totalcols = 0;
    var cmkMaj = Object.keys(neededLabels);
    for (var n=0; n<cmkMaj.length; n++) {
        for (var m=0; m<neededLabels[cmkMaj[n]].length; m++) {
            totalcols += 1;
        }
    }
    var colwidth = Math.floor((canvaswidth - leftmargin - gap) / totalcols);
    console.log(colwidth);
    return colwidth;
}    

function drawLines(ctx, activeDistros, neededLabels) {
    var colwidth = calculateColWidth(activeDistros, neededLabels);
    var cmkMaj = Object.keys(neededLabels);
    var totalcols = 0;
    var extra = 0;
    // console.log(neededLabels);
    ctx.strokeStyle = "#61707c";
    for (var n=0; n<cmkMaj.length; n++) {
        for (var m=0; m<neededLabels[cmkMaj[n]].length; m++) {
            ctx.beginPath();
            if (m == 0) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#000000";
                extra += gap;
            } else {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#61707c";
            }
            ctx.moveTo(leftmargin + 10 + extra + colwidth * totalcols, topmargin - 10);
            ctx.lineTo(leftmargin + 10 + extra + colwidth * totalcols, topmargin + activeDistros.length * lheight + 10);
            ctx.stroke();
            totalcols += 1;
        }
    }
}

function drawLabels(ctx, activeDistros, neededLabels) {
    var colwidth = calculateColWidth(activeDistros, neededLabels);
    var cmkMaj = Object.keys(neededLabels);
    var totalcols = 0;
    var extra = 0;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
     for (var n=0; n<cmkMaj.length; n++) {
        for (var m=0; m<neededLabels[cmkMaj[n]].length; m++) {
            if (m == 0) {
                extra += gap;
            }
            ctx.save();
            ctx.translate(leftmargin + 27 + extra + colwidth * totalcols, topmargin - 15);
            ctx.rotate(-Math.PI/2);
            ctx.textAlign = "left";
            ctx.fillText(neededLabels[cmkMaj[n]][m], 0, 0);
            ctx.restore();
            totalcols += 1;
        }
    }
}
    
function drawGreenBoxes(j, ctx, activeDistros, neededLabels) {
    var colwidth = calculateColWidth(activeDistros, neededLabels);
    var cmkMaj = Object.keys(neededLabels);
    var totalcols = 0;
    var extra = 0;
    ctx.fillStyle = "#15d1a0";
    // console.log(activeDistros);
    for (var n=0; n<cmkMaj.length; n++) {
        for (var m=0; m<neededLabels[cmkMaj[n]].length; m++) {
            if (m == 0) {
                extra += gap;
            }
            for (var o=0; o<activeDistros.length; o++) {
                for (var p=0; p<distroorder.length; p++) {
                    if (activeDistros[o] == distroorder[p][1]) {
                        if (j['cre'][cmkMaj[n]][neededLabels[cmkMaj[n]][m]][distroorder[p][0]][distroorder[p][1]] == 'supported') {
                            // console.log("Painting box: " + distroorder[p][1] + ' ' + neededLabels[cmkMaj[n]][m]);
                            var boxwidth = colwidth;
                            if (m == neededLabels[cmkMaj[n]].length - 1 && !oldVersions.includes(cmkMaj[n])) {
                                boxwidth -= arrowwidth;
                                ctx.beginPath();
                                ctx.moveTo(leftmargin + 10 + extra + colwidth * totalcols + boxwidth, topmargin + lheight * o);
                                ctx.lineTo(leftmargin + 10 + extra + colwidth * totalcols + boxwidth, topmargin + lheight * o + lheight - 1);
                                ctx.lineTo(leftmargin + 10 + extra + colwidth * totalcols + boxwidth + arrowwidth, topmargin + lheight * o + lheight / 2);
                                ctx.closePath();
                                ctx.fill();
                            }
                            ctx.fillRect(leftmargin + 10 + extra + colwidth * totalcols, topmargin + lheight * o, boxwidth, lheight - 1); // 3 Boxes
                        }
                    }
                }
            }
            totalcols += 1;
        }
    }
}

/*
 * Convenience functions for anchors
 *
 */

function goToLinkWithAnchor(e) {
	var ptoks = window.location.href.split('#');
	if (ptoks.length > 1) {
		var myhref = e.target.getAttribute("href");
		e.target.setAttribute("href", myhref + "#" + ptoks[1]);
	}
}

// Jump to an anchor on the current page. Might be used if the anchor slipped down or only appeared after some DOM manipulation.
function jumpToAnchor(a) {
	window.location.href = "#" + a;
}

function reloadAnchor() {
    var ptoks = window.location.href.split('#');
	if (ptoks.length > 1) {
        window.location.href = "#" + ptoks[1];
    }
}

function doNotBubble(e) {
    console.log("Not bubbling: " + e);
	e.stopPropagation();
}

 // Conference banner, remove after 2024/06/12

function addConfBanner() {
    var now = Date.now();
    console.log("Now it is: " + now);
    if (now > 1718229600000) {
        return;
    }
    var sidebar = document.getElementsByClassName("main-nav__content")[0];
    var body = document.getElementsByTagName("body")[0];
    var text = "Join us for the highlight of the year when the Checkmk Community gets together in Munich from June 11-13.";
    var pagewidth = window.innerWidth;
    var pageheight = window.innerHeight;
    var imgsrc = "../../assets/images/BlogBanner10_en_mobile_1.png";
    if (window.location.pathname.match(/\/de\//)) {
		imgsrc = "../../assets/images/BlogBanner10_de_mobile_1.png";
        text = "Das Highlight des Jahres: Vom 11. - 13. Juni 2024 kommt die Checkmk Community in München zusammen.";
	}
    // Show footer in sidebar:
    var imgwidth = "92%";
    console.log("Viewport dimensions: " + pagewidth + ", by " + pageheight);
    if (pageheight > pagewidth && pagewidth > 600) {
        imgsrc = "../../assets/images/Conf10_CMK_Download_Banner_en_21.png";
        if (window.location.pathname.match(/\/de\//)) {
            imgsrc = "../../assets/images/Conf10_CMK_Download_Banner_de_21.png";
        }
        imgwidth = "96%"; // pagewidth * 0.96;
    } else if (pageheight < pagewidth && pageheight < 1086) {
        imgsrc = "../../assets/images/Conf10_CMK_Download_Banner_en_21.png";
        if (window.location.pathname.match(/\/de\//)) {
            imgsrc = "../../assets/images/Conf10_CMK_Download_Banner_de_21.png";
        }
        imgwidth = "92%";
    }
    var link = document.createElement("a");
    link.setAttribute("href", "https://conference.checkmk.com/");
    link.setAttribute("id", "conference_skyscraper");
    link.setAttribute("target", "_blank");
    var img = document.createElement("img");
    img.setAttribute("width", imgwidth);
    img.setAttribute("src", imgsrc);
    link.appendChild(img);
    sidebar.appendChild(link);
    if (document.cookie.includes("hidebanner")) {
        return true;
    }
     // Show footer on bottom:
    if (pageheight < pagewidth && pagewidth > 991) {
        var footer = document.createElement("div");
        footer.setAttribute("class", "footer_banner");
        var close = document.createElement("div");
        close.setAttribute("class", "footer_banner_close");
        var cbutton = document.createElement("button");
        cbutton.setAttribute("id", "footer_close_button");
        var cont = document.createElement("div");
        cont.setAttribute("class", "footer_banner_content");
        var left = document.createElement("div");
        left.setAttribute("class", "footer_banner_content_left");
        var cent = document.createElement("div");
        cent.setAttribute("class", "footer_banner_content_center");
        var right = document.createElement("div");
        right.setAttribute("class", "footer_banner_content_right");
        var p = document.createElement("p");
        p.appendChild(document.createTextNode(text));
        var smllogo = document.createElement("img");
        smllogo.setAttribute("alt", "Checkmk Conference #10");
        smllogo.setAttribute("src", "/assets/images/conference_10_logo.svg");
        var lnk = document.createElement("a");
        lnk.setAttribute("href", "https://conference.checkmk.com/");
        lnk.setAttribute("target", "_blank");
        lnk.appendChild(document.createTextNode("Register now"));
        left.appendChild(smllogo);
        cent.appendChild(p);
        cont.appendChild(left);
        cont.appendChild(cent);
        right.appendChild(lnk);
        cont.appendChild(right);
        close.appendChild(cbutton);
        footer.appendChild(close);
        footer.appendChild(cont);
        body.appendChild(footer);
        link.style.display = "none";
        // Add an event listener for scrolling
        document.addEventListener("scroll", (event) => {
            lastKnownScrollPosition = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    scrollBannerOut(lastKnownScrollPosition);
                    ticking = false;
                });
                ticking = true;
            }
        });
        cbutton.addEventListener("click", (event) => {
            document.cookie = "hidebanner=1; path=/";
            footer.style.display = "none";
        });
    }
}

function scrollBannerOut(ypos) {
    var banner = document.getElementsByClassName("footer_banner")[0];
    if (ypos > 550) {
        document.getElementById("conference_skyscraper").style.display = "block";
        return true;
    }
    document.getElementById("conference_skyscraper").style.display = "none";
    banner.style.bottom = "-" + (ypos / 4) + "px";
}