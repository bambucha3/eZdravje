var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
            "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */


var trenutniEhr;
var prviUporabnik, drugiUporabnik, tretjiUporabnik;


function kreirajEHR() {
    sessionId = getSessionId();

    var ime = $("#kreirajIme").val();
    var priimek = $("#kreirajPriimek").val();
    var datumRojstva = $("#kreirajDatumRojstva").val();

    if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
        $("#kreirajSporocilo").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Prosim vnesi vse zahtevane podatke!</div>");
    }
    else {
        $.ajaxSetup({
            async: false,
            headers: {
                "Ehr-Session": sessionId
            }
        });
        $.ajax({
            async: false,
            url: baseUrl + "/ehr",
            type: "POST",
            success: function(data) {
                var ehrId = data.ehrId;
                var partyData = {
                    firstNames: ime,
                    lastNames: priimek,
                    dateOfBirth: datumRojstva,
                    partyAdditionalInfo: [{
                        key: "ehrId",
                        value: ehrId
                    }]
                };
                $.ajax({
                    async: false,
                    url: baseUrl + "/demographics/party",
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(partyData),
                    success: function(party) {
                        if (party.action == "CREATE") {
                            $("#kreirajSporocilo").html("<div class='alert alert-dismissible alert-success'><button type='button' class='close' data-dismiss='alert'>&times;</button>Uspešno kreiran EHR: " + ehrId + "</div>");
                            $("#preberiEHRid").val(ehrId);
                        }
                    },
                    error: function(err) {
                        $("#kreirajSporocilo").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Napaka " + JSON.parse(err.responseText).userMessage + "!</div>");
                    }

                });
            }
        });
    }
}

function preberiEhrId() {
    sessionId = getSessionId();
    var ehrId = $("#prijavaEhr").val();

    if (!ehrId || ehrId.trim().length == 0) {
        $("#prijavaUporabnika").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Prosim vnesi vse zahtevane podatke!</div>");
    }
    else {
        trenutniEhr = ehrId;
        $.ajax({
            async: false,
            url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
            type: "GET",
            headers: {
                "Ehr-Session": sessionId
            },
            success: function(data) {
                var party = data.party;
                $("#prijavaUporabnika").html("<div class='alert alert-dismissible alert-success'><button type='button' class='close' data-dismiss='alert'>&times;</button>Uspešno prijavljen/a: " + party.firstNames + " " + party.lastNames + ", rojen/a " + party.dateOfBirth + ".</div>");
                $("#vnosFieldset").prop("disabled", false);
                $("#collapseRegistracija").collapse("hide");
                $("#collapseNavodilaHide").collapse("hide");
            },
            error: function(err) {
                $("#prijavaUporabnika").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Napaka " + JSON.parse(err.responseText).userMessage + "!</div>");

            }
        });
    }
}

function dodajMeritev() {
    sessionId = getSessionId();

    var datumInUra = $("#dodajMeritevDatumInUra").val();
    var krvniSladkor = $("#dodajMeritevKrvniSladkor").val();
    var celodnevniInzulin = $("#dodajMeritevCelodnevniInzulin").val();
    var teza = $("#dodajMeritevTeza").val();

    if (!trenutniEhr || trenutniEhr.trim().length == 0) {
        $("#vnosMeritveSporocilo").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Pred vnašanjem meritev se je potrebno prijaviti!</div>");
    }
    else {
        $.ajaxSetup({
            async: false,
            headers: {
                "Ehr-Session": sessionId
            }
        });
        var podatki = {
            "partyAdditionalInfo": [{
                "key": "ehr",
                "value": trenutniEhr
            }, {
                "key": "datum_ura",
                "value": datumInUra
            }, {
                "key": "teza",
                "value": teza
            }, {
                "key": "krvni_sladkor",
                "value": krvniSladkor
            }, {
                "key": "celodnevni_inzulin",
                "value": celodnevniInzulin
            }]
        };
        
        $.ajax({
            async: false,
            url: baseUrl + "/demographics/party",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(podatki),
            success: function(res) {
                $("#vnosMeritveSporocilo").html("<div class='alert alert-dismissible alert-success'><button type='button' class='close' data-dismiss='alert'>&times;</button>Uspešno dodana meritev: " + res.meta.href + ".</div>");
            },
            error: function(err) {
                $("#vnosMeritveSporocilo").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Napaka " + JSON.parse(err.responseText).userMessage + "!</div>");

            }
        });
    }
}

$(document).ready(function() {
    $("#vnosFieldset").prop("disabled", true);
});
var arrayZadnjihMeritev = [];

var zadnjaMeritev = 0;
var tedenskoPovprecje = 0;
var tedenskoMeritev = 0;
var mesecnoPovprecje = 0;
var mesecnoMeritev = 0;
var stKriticnih = 0;
var pravilo100 = 0;
var zadnjiCelodnevni = 0;
var zadnjaTeza = 0;

function preberiZgodovinoMeritev() {
    sessionId = getSessionId();

    var ehrId = trenutniEhr;
    var array = [0, 0, 0, 0, 0];

    if (!ehrId || ehrId.trim().length == 0) {
        $("#rezultatiMeritev").html("<div class='panel-body'><div class='alert alert-dismissible alert-danger'><button type='button' class='close' data-dismiss='alert'>&times;</button>Prosim prijavite se!</div></div>");
    }
    else {
        var searchData = [{
            key: "ehr",
            value: trenutniEhr
        }];
        $.ajax({
            async: false,
            url: baseUrl + "/demographics/party/query",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(searchData),
            headers: {
                "Ehr-Session": sessionId
            },
            success: function(res) {
                arrayZadnjihMeritev = [];
                
                zadnjaMeritev = 0;
                tedenskoPovprecje = 0;
                tedenskoMeritev = 0;
                mesecnoPovprecje = 0;
                mesecnoMeritev = 0;
                stKriticnih = 0;
                pravilo100 = 0;
                zadnjiCelodnevni = 0;
                zadnjaTeza = 0;
                
                
                var results = "";
                        results += "<table class=\"table table-striped table-hover table-condensed\">";
                        results += "            <thead>";
                        results += "              <tr>";
                        results += "                <th class=\"text-center\">Čas";
                        results += "                  <br><span class='notbold'>(datum\/ura)<\/span><\/th>";
                        results += "                <th class=\"text-center\">Sladkor v krvi";
                        results += "                  <br><span class='notbold'>(mmol\/L)<\/span><\/th>";
                        results += "                <th class=\"text-center\">Celodnevni odmerek";
                        results += "                  <br><span class='notbold'>(E)<\/span><\/th>";
                        results += "                <th class=\"text-center\">Teža";
                        results += "                  <br><span class='notbold'>(kg)<\/span><\/th>";
                        results += "              <\/tr>";
                        results += "            <\/thead>";

                for (i in res.parties) {
                    var party = res.parties[i];
                    var datum = "";
                    var sladkor = "";
                    var celodnevni = "";
                    var tezaa = "";
                    for (j in party.partyAdditionalInfo) {
                        if (party.partyAdditionalInfo[j].key === "datum_ura") {
                            datum = party.partyAdditionalInfo[j].value;
                        }
                        if (party.partyAdditionalInfo[j].key === "krvni_sladkor") {
                            sladkor = party.partyAdditionalInfo[j].value;
                        }
                        if (party.partyAdditionalInfo[j].key === "celodnevni_inzulin") {
                            celodnevni = party.partyAdditionalInfo[j].value;
                        }
                        if (party.partyAdditionalInfo[j].key === "teza") {
                            tezaa = party.partyAdditionalInfo[j].value;
                        }
                        if (sladkor != "" && datum != "" && celodnevni != "" && tezaa != "") break;
                    }
                    results += "<tr><td>" + datum + "</td><td>" + sladkor + "</td><td>" + celodnevni + "</td><td>" + tezaa + "</td></tr>";
                    var today = new Date();
                    
                    var lastMonth = Date.UTC(today.getFullYear(), today.getMonth()-1, today.getDate());
                    var lastWeek = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()-7);
                    
                    var temp = datum.split("-");
                    var temp2 = temp[2].split("T");
                    var temp3 = temp2[1].split(":");
                    
                    var dateTemp = Date.UTC(temp[0], temp[1]-1, temp2[0], temp3[0], temp3[1]);
                    
                    
                    var sladkorInt = parseFloat(sladkor);
                    zadnjaMeritev = sladkorInt;
                    zadnjiCelodnevni = parseFloat(celodnevni);
                    zadnjaTeza = tezaa;
                    
                    if (dateTemp > lastWeek){
                        tedenskoMeritev ++;
                        tedenskoPovprecje += sladkorInt;
                    }
                    
                    if (dateTemp > lastMonth){
                        if (sladkorInt > 15 || sladkorInt < 1.5) stKriticnih ++;
                        mesecnoMeritev ++;
                        mesecnoPovprecje += sladkorInt;
                        arrayZadnjihMeritev.push([dateTemp, parseFloat(sladkor)]);
                    }
                    
                    if (sladkorInt > 15) array[0] ++;
                    else if (sladkorInt > 6) array[1] ++;
                    else if (sladkorInt > 3.5) array[2] ++;
                    else if (sladkorInt > 1.5) array[3] ++;
                    else array[4] ++;
                    
                }
                results += "</tbody>";
                results += "";
                results += "          <\/table>";
                
                tedenskoPovprecje = tedenskoPovprecje / tedenskoMeritev;
                mesecnoPovprecje = mesecnoPovprecje / mesecnoMeritev;
                pravilo100 = 100 / zadnjiCelodnevni;
                
                var kartice = "";
                
                if (zadnjaMeritev <= 6 && zadnjaMeritev >= 3.5){
                    kartice += "<div class=\"alert alert-dismissible alert-success\">";
                    kartice += "                  <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;<\/button>";
                    kartice += "                  <h4><strong>Vse v redu!<\/strong><\/h4>";
                    kartice += "                  <p>Sladkor v krvi je v običajnih mejah.";
                    kartice += "                <\/div>";
                    
                }
                
                if (zadnjaMeritev > 6 || zadnjaMeritev < 3.5){
                    kartice += "<div class=\"alert alert-dismissible alert-" + ((zadnjaMeritev > 15 || zadnjaMeritev < 1.5)? "danger" : "warning") + "\">";
                    kartice += "                  <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;<\/button>";
                    kartice += "                  <h4><strong>" + ((zadnjaMeritev > 15 || zadnjaMeritev < 1.5)? "Nevarnost!" : "Pozor!") + "<\/strong><\/h4>";
                    kartice += "                  <p>Sladkor v krvi je <strong>" + ((zadnjaMeritev > 6)? "previsok" : "prenizek") + "<\/strong> za " + Math.round(Math.abs(zadnjaMeritev - ((zadnjaMeritev > 6)? 6 : 3.5)) * 100) / 100 + " mmol\/L.";
                    kartice += "                  <br><hr class=\"m-y-2\">";
                    if(zadnjaMeritev > 6){
                        kartice += "                    Priporočam doziranje " + Math.round(((zadnjaMeritev - 6) / pravilo100) * 100) / 100  + " enot inzulina.<\/p>";
                    }
                    else{
                        kartice += "                    Priporočam zaužitje " + Math.round((zadnjaTeza / 10 * 4) * 100) / 100 + " g glukoze.<\/p>";
                        if (zadnjaMeritev < 1.5)  kartice += "                    <br><h4><strong>Nujno injeciranje glukagona direktno v mišico in klic na 112!</strong></h4><\/p>";
                    }
                    kartice += "                <\/div>";
                }
                
                if (zadnjaMeritev < 1.5){
                    kartice += "<div class=\"alert alert-dismissible alert-danger\">";
                    kartice += "                  <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;<\/button>";
                    kartice += "                  <h4><strong>Nevarnost!</strong><\/h4>";
                    kartice += "                  <p>Trenutni sladkor v krvi je <strong>pod mejo 1,5 mmol\/L<\/strong>";
                    kartice += "                  <br><hr class=\"m-y-2\">";
                    kartice += "                    <h4><strong>Nujno injeciranje glukagona direktno v mišico in klic na 112!</strong></h4><\/p>";
                    kartice += "                  <p>Zemljevid bližnjih bolnic:<\/p>";
                    kartice += "                  <br>";
                    kartice += "                  <div class=\"embed-responsive embed-responsive-4by3\">";
                    kartice += "                     <iframe";
                    kartice += "                        frameborder=\"0\" style=\"border:0\"";
                    kartice += "                        src=\"https:\/\/www.google.com\/maps\/embed\/v1\/search?key=AIzaSyB6Xf5dwceYLFR9S0DGQ-dycZwEsq-cPA8";
                    kartice += "                        &q=bolnišnica\" allowfullscreen>";
                    kartice += "                    <\/iframe>";
                    kartice += "                  <\/div>";
                    kartice += "                <\/div>";
                }
                
                if (mesecnoPovprecje > 6){
                    kartice += "<div class=\"alert alert-dismissible alert-warning\">";
                    kartice += "                  <button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;<\/button>";
                    kartice += "                  <h4><strong>Pozor!</strong><\/h4>";
                    kartice += "                  <p>Mesečno povprečje sladkorja v krvi je <strong>visoko<\/strong>.";
                    kartice += "                  <br><hr class=\"m-y-2\">";
                    kartice += "                    Priporočam zvišanje doziranja inzulina za " + Math.round(((mesecnoPovprecje - 6) / pravilo100) * 100) / 100  + " enot inzulina na dan ter obisk pri servisu inzulinskih črpalk.<\/p>";
                    kartice += "                  <p>Zemljevid bližnjih servisov inzulinskih črpalk:<\/p>";
                    kartice += "                  <br>";
                    kartice += "                  <div class=\"embed-responsive embed-responsive-4by3\">";
                    kartice += "                     <iframe";
                    kartice += "                        frameborder=\"0\" style=\"border:0\"";
                    kartice += "                        src=\"https:\/\/www.google.com\/maps\/embed\/v1\/search?key=AIzaSyB6Xf5dwceYLFR9S0DGQ-dycZwEsq-cPA8";
                    kartice += "                        &q=Zaloker%20%26%20Zaloker \" allowfullscreen>";
                    kartice += "                    <\/iframe>";
                    kartice += "                  <\/div>";
                    kartice += "                <\/div>";
                }
                

                $("#prostorKartice").html(kartice);
                
                $("#statistika1").html(Math.round(tedenskoPovprecje * 100) / 100 + " mmol/L");
                $("#statistika2").html(Math.round(mesecnoPovprecje * 100) / 100 + " mmol/L");
                $("#statistika3").html(Math.round(pravilo100 * 100) / 100 + " mmol/L");
                $("#statistika4").html(stKriticnih);
                
                
                var chart = $('#graph').highcharts();
                chart.series[0].setData(arrayZadnjihMeritev, true);
                var chart2 = $('#graphPie').highcharts();
                chart2.series[0].setData(array, true);
                $("#rezultatiMeritev").html(results);
            },
            error: function(err) {
                $("#rezultatiMeritev").html("<div class='panel-body'><div class='alert alert-dismissible alert-danger'><button type='button' class='close' data-dismiss='alert'>&times;</button>Napaka " + JSON.parse(err.responseText).userMessage + "!</div></div>");
            }
        });
    }
}

function pobrisiMeritev(){
    $("#dodajMeritevDatumInUra").val("");
    $("#dodajMeritevKrvniSladkor").val("");
    $("#dodajMeritevCelodnevniInzulin").val("");
    $("#dodajMeritevTeza").val("");
}

function pobrisiRegistracijo(){
    $("#kreirajIme").val("");
    $("#kreirajPriimek").val("");
    $("#kreirajDatumRojstva").val("")
}

function insertTrenutniCas(){
    var today = new Date();
    var hours = today.getHours().toString();
    var minutes = today.getMinutes().toString();
    if (hours.length == 1) hours = "0" + hours;
    if (minutes.length == 1) minutes = "0" + minutes;
    $("#dodajMeritevDatumInUra").val(today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate() + "T" + hours + ":" + minutes);
}

function insertTrenutniCelodnevni(){
    if (zadnjiCelodnevni != 0) $("#dodajMeritevCelodnevniInzulin").val(zadnjiCelodnevni);
}

function insertTrenutnoTezo(){
    if (zadnjaTeza != 0) $("#dodajMeritevTeza").val(zadnjaTeza);
}

function prviGeneriran(){
    if (prviUporabnik != "" && prviUporabnik.trim().length != 0){
        $("#prijavaEhr").val(prviUporabnik);
        trenutniEhr = prviUporabnik;
        preberiEhrId();
        preberiZgodovinoMeritev();
    }
}

function drugiGeneriran(){
    if (drugiUporabnik != "" && drugiUporabnik.trim().length != 0){
        $("#prijavaEhr").val(drugiUporabnik);
        trenutniEhr = drugiUporabnik;
        preberiEhrId();
        preberiZgodovinoMeritev();
    }
}

function tretjiGeneriran(){
    if (tretjiUporabnik != "" && tretjiUporabnik.trim().length != 0){
        $("#prijavaEhr").val(tretjiUporabnik);
        trenutniEhr = tretjiUporabnik;
        preberiEhrId();
        preberiZgodovinoMeritev();
    }
}

function generirajPodatke(stPacienta) {
    ehrIdreturn = "";
    var ime, priimek, datum;
    sessionId = getSessionId();
    
    if (stPacienta == 1){
        ime = "Janez";
        priimek = "Novak";
        datum = "1997-11-11T04:01";
    }
    else if (stPacienta == 2){
        ime = "Micka";
        priimek = "Janša";
        datum = "1985-4-3T12:15";
    }
    else {
        ime = "John";
        priimek = "Cena";
        datum = "1977-4-13T09:01";
    }
    
    $.ajaxSetup({
        async: false,
        headers: {
            "Ehr-Session": sessionId
        }
    });
    $.ajax({
        async: false,
        url: baseUrl + "/ehr",
        type: "POST",
        success: function(data) {
            var ehrId = data.ehrId;
            var partyData = {
                firstNames: ime,
                lastNames: priimek,
                dateOfBirth: datum,
                partyAdditionalInfo: [{
                    key: "ehrId",
                    value: ehrId
                }]
            };
            $.ajax({
                async: false,
                url: baseUrl + "/demographics/party",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(partyData),
                success: function(party) {
                    if (party.action == "CREATE") {
                        ehrIdreturn = ehrId;
                        if (stPacienta == 1) prviUporabnik = ehrId;
                        else if (stPacienta == 2) drugiUporabnik = ehrId;
                        else tretjiUporabnik = ehrId;
                    }
                },
                error: function(err) {
                    $("#kreirajSporocilo").html("<div class='alert alert-dismissible alert-warning'><button type='button' class='close' data-dismiss='alert'>&times;</button>Napaka " + JSON.parse(err.responseText).userMessage + "!</div>");
                }

            });
        }
    });
}

function generirajPodatkeMeritve(stPacienta, datum, sladkor, celodnevni, teza){
    sessionId = getSessionId();
    var ehrId;
    if (stPacienta == 1) ehrId = prviUporabnik;
    else if (stPacienta == 2) ehrId = drugiUporabnik;
    else ehrId = tretjiUporabnik;
    
    $.ajaxSetup({
        async: false,
        headers: {
            "Ehr-Session": sessionId
        }
    });
    
    var podatki = {
        "partyAdditionalInfo": [{
            "key": "ehr",
            "value": ehrId
        }, {
            "key": "datum_ura",
            "value": datum
        }, {
            "key": "teza",
            "value": teza
        }, {
            "key": "krvni_sladkor",
            "value": sladkor
        }, {
            "key": "celodnevni_inzulin",
            "value": celodnevni
        }]
    };
    
    $.ajax({
        async: false,
        url: baseUrl + "/demographics/party",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(podatki),
        success: function(res) { 
        },
        error: function(err) {
        }
    });
}

function GenPodatke(){
    generirajPodatke(1);
    generirajPodatke(2);
    generirajPodatke(3);
    
    generirajPodatkeMeritve(1, "2016-5-20T12:05", "6.4", "55", "60");
    generirajPodatkeMeritve(1, "2016-5-20T18:20", "3.7", "55", "60");
    generirajPodatkeMeritve(1, "2016-5-21T12:30", "2.4", "55", "60");
    generirajPodatkeMeritve(1, "2016-5-21T19:05", "8.9", "50", "60");
    generirajPodatkeMeritve(1, "2016-5-21T22:30", "7.4", "50", "60");
    generirajPodatkeMeritve(1, "2016-5-22T11:45", "5.2", "50", "60");
    generirajPodatkeMeritve(1, "2016-5-22T15:20", "4.7", "50", "60");
    generirajPodatkeMeritve(1, "2016-5-22T20:35", "1.4", "50", "60");
    
    generirajPodatkeMeritve(2, "2016-6-3T14:20", "3.5", "40", "49");
    generirajPodatkeMeritve(2, "2016-6-3T16:40", "8.0", "40", "49");
    generirajPodatkeMeritve(2, "2016-6-3T20:15", "13.4", "40", "49");
    generirajPodatkeMeritve(2, "2016-6-4T12:05", "10.2", "50", "49");
    generirajPodatkeMeritve(2, "2016-6-4T14:55", "8.3", "50", "50");
    generirajPodatkeMeritve(2, "2016-6-4T17:35", "4.7", "50", "50");
    generirajPodatkeMeritve(2, "2016-6-4T22:10", "1.7", "50", "50");
    generirajPodatkeMeritve(2, "2016-6-5T03:15", "10.7", "40", "50");
    generirajPodatkeMeritve(2, "2016-6-5T13:25", "7.2", "40", "50");
    generirajPodatkeMeritve(2, "2016-6-5T18:30", "3.5", "40", "50");
    generirajPodatkeMeritve(2, "2016-6-6T14:35", "4.5", "40", "50");
    generirajPodatkeMeritve(2, "2016-6-6T18:10", "5.7", "40", "49");
    
    generirajPodatkeMeritve(3, "2016-5-27T15:30", "6.2", "70", "90");
    generirajPodatkeMeritve(3, "2016-5-28T18:10", "7.3", "70", "91");
    generirajPodatkeMeritve(3, "2016-5-29T14:20", "3.2", "70", "92");
    generirajPodatkeMeritve(3, "2016-5-30T11:00", "4.7", "70", "91");
    generirajPodatkeMeritve(3, "2016-5-31T20:15", "6.2", "70", "92");
    generirajPodatkeMeritve(3, "2016-6-1T22:35", "2.4", "70", "91");
    generirajPodatkeMeritve(3, "2016-6-2T17:40", "3.7", "70", "90");
    generirajPodatkeMeritve(3, "2016-6-3T19:50", "6.4", "70", "89");
    generirajPodatkeMeritve(3, "2016-6-4T17:05", "5.2", "70", "90");
    generirajPodatkeMeritve(3, "2016-6-5T12:00", "6.7", "70", "90");
    
    $('#btnGeneriraj').removeClass('btn-primary').addClass('btn-success ');
    $('#btnJanez').removeClass('disabled');
    $('#btnMicka').removeClass('disabled');
    $('#btnJohn').removeClass('disabled');
    
    $("#prijavaUporabnika").html("<div class='alert alert-dismissible alert-success'><button type='button' class='close' data-dismiss='alert'>&times;</button>Uspešno generirani podatki:<br>" + prviUporabnik + "<br>" + drugiUporabnik + "<br>" + tretjiUporabnik + "<br>Klikni na ime za avtomatsko prijavo!</div>");
}

$(function() {
    $('#graph').highcharts({
        chart: {
            type: 'spline'
        },
        title: {
            text: ''
        },
        xAxis: {
            type: 'datetime',
            labels: {
                overflow: 'justify'
            }
        },
        yAxis: {
            title: {
                text: 'Sladkor v krvi (mmol/L)'
            },
            minorGridLineWidth: 0,
            gridLineWidth: 0,
            alternateGridColor: null,
            plotBands: [{
                from: 0.0,
                to: 3.5,
                label: {
                    text: 'Hipoglikemija',
                    style: {
                        color: '#606060'
                    }
                }
            }, {
                from: 1.5,
                to: 3.5,
                color: 'rgba(255, 133, 27, 0.2)',
            }, {
                from: 0.0,
                to: 1.5,
                color: 'rgba(255, 65, 54, 0.2)',
            }, {
                from: 3.5,
                to: 6,
                color: 'rgba(40, 182, 44, 0.4)',
                label: {
                    text: 'V redu',
                    style: {
                        color: '#606060'
                    }
                }
            }, {
                from: 6,
                to: 25,
                label: {
                    text: 'Hiperglikemija',
                    style: {
                        color: '#606060'
                    }
                }
            }, {
                from: 6,
                to: 15,
                color: 'rgba(255, 133, 27, 0.2)',
            }, {
                from: 15,
                to: 100,
                color: 'rgba(255, 65, 54, 0.2)',
            }]
        },
        tooltip: {
            valueSuffix: ' mmol/L'
        },
        plotOptions: {
            spline: {
                lineWidth: 4,
                states: {
                    hover: {
                        lineWidth: 5
                    }
                },
                marker: {
                    enabled: false
                },
            }
        },
        series: [{
            name: 'Sladkor v krvi',
            data: [],
            color: 'rgba(0, 0, 0, 0.6)'
        }],
        navigation: {
            menuItemStyle: {
                fontSize: '10px'
            }
        }
    });
});

$(function () {
    $('#graphPie').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: ''
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.0f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
        series: [{
            name: 'Brands',
            colorByPoint: true,
            data: [{
            	name: "HIPER",
              y: 1,
              color: "#FF4136"
            },
            {
            	name: "hiper",
              y: 1,
              color: "#FF851B"
            },
            {
            	name: "OK",
              y: 1,
              color: "#28B62C"
            },
            {
            	name: "hipa",
              y: 1,
              color: "#FF851B"
            },
            {
            	name: "HIPA",
              y: 1,
              color: "#FF4136"
            }]
        }]
    });
});