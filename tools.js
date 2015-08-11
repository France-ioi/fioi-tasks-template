'use strict';

var Language = {

  baliseFromLanguage : function(x)
  {
    switch (x)
    {
      case "C++" : return "cpp";
      case "C" : return "c";
      case "Pascal" : return "pascal";
      case "OCaml" : return "ocaml";
      case "Java" : return "java";
      case "JavaScool" : return "javascool";
      case "Python" : return "java";
      case "Text" : return "plain";
      case "Pseudo" : return "pseudo";
      default : alert("Unknown language " + x);
    }
  },

  extensionFromLanguage : function(x)
  {
    switch (x)
    {
      case "C++" : return "cpp";
      case "C" : return "c";
      case "Pascal" : return "pas";
      case "OCaml" : return "ml";
      case "Java" : return "java";
      case "JavaScool" : return "jvs";
      case "Python" : return "py";
      default : alert("Unknown language " + x);
    }
  },

  languageFromExtension : function(x)
  {
    switch (x)
    {
      case "cpp" : return "C++";
      case "c" : return "C";
      case "pas" : return "Pascal";
      case "ml" : return "OCaml";
      case "java" : return "Java";
      case "jvs" : return "JavaScool";
      case "py" : return "Python";
      default : alert("Unknown extension '" + x + "'");
    }
  }
};

function translate(s, lang)
{
  var translations = {
    subject :     { fr : "sujet", en : "subject" },
    solve :       { fr : "résoudre", en : "solve" },
    correction :  { fr : "correction", en : "correction" },
    time :        { fr : "temps", en : "time" },
    memory :      { fr : "mémoire", en : "memory" },
    input :       { fr : "entrée", en : "input" },
    output :      { fr : "sortie", en : "output" },
    limits :      { fr : "limites de temps et de mémoire", en : "time and memory limits" },
    constraints : { fr : "contraintes", en : "constraints" },
    examples :    { fr : "exempes", en : "examples" },
    comments :    { fr : "commentaires", en : "comments" }
  };

  if (!translations[s] || !translations[s][lang])
  {
    alert("Unable to translate '" + s + "' in " + lang);
    return "";
  }

  return translations[s][lang];
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
