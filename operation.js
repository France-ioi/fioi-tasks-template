var task = {};

task.getMetaData = function(callback)
{
  if (typeof json == 'undefined')
    json = {};
  callback(json);
}

task.getViews = function(callback) {
  var views = {
    task: {},
    animation : {},
    hints : {},
    solution: {}
  };
  callback(views);
};

task.showViews = function(views, callback)
{
   $.each(['task', 'animation', 'hints', 'solution'], function(i, view) {
      if (view in views)
        $('#view-' + view).show();
      else
        $('#view-' + view).hide();
   });
   callback();
};

task.printViewChooser = true; // miniPlatform shows view chooser

task.load = function(views, callback) // TODO: handle views
{
  var sSelectedLanguage = "C++"; // TODO : Parametre lors du chargement
  
  if (typeof json == 'undefined')
    json = {};
  if (typeof json.language == 'undefined')
    json.language = "fr";
  if (typeof json.baseUrl == 'undefined')
    json.baseUrl = "";
  
  var initViews = function()
  {
    if ($("#views").length == 0)
      $(document.body).prepend('<div id="views"></div>');
    
    $("#views").html("");
    $("#views").append($('<div id="view-task"></div>'));
    $("#views").append($('<div id="view-animation"></div>'));
    $("#views").append($('<div id="view-hints"></div>'));
    $("#views").append($('<div id="view-solution"></div>'));
    
    $("#views").children().hide();
    
    function initCodeTabs()
    {
      $("div.codeTabs").each(function()
      {
        var me = $(this);

        var ul = $("<ul></ul>");
        $(this).children("div").each(function (index)
        {
          $(this).attr('id', 'tabs-'+index);
          var lang = $(this).attr('lang');
          $(ul).append('<li><a href="#tabs-'+index+'">'+lang+'</a></li>');
        });
        me.prepend(ul);

        me.tabs();
      });
    }
    
    function addSources(s)
    {
      var result = s;
      
      if (typeof FIOITaskMetaData.sources != "undefined")
      for (var iGroup in FIOITaskMetaData.sources)
      {
        var group = $("#sources-" + iGroup).html();
        var groupfull = "<div class='codeTabs'>" + group + "</div>";
        result = result.replace(new RegExp("\\[GROUP:" + iGroup + "\\]", "gi"), group);
        result = result.replace(new RegExp("\\[GROUPFULL:" + iGroup + "\\]", "gi"), groupfull);
      }
      
      return result;
    }
    
    function transformHtml(s)
    {
      var tags = {
        "c" : "c",
        "cpp" : "cpp",
        "ocaml" : "ocaml",
        "java" : "java",
        "javascool": "java",
        "jvs" : "java",
        "python" : "python",
        "pascal" : "pascal",
        "plain" : "plain",
        "pseudo" : "plain",
        // TODO
        "cout" : "plain",
        "cin" : "plain",
        "couterror" : "plain"
      };
      
      var dom = $("<div>").html(s);
      
      dom.find("img,script").each(function() {
        var url = $(this).attr("src");
        if (url.search("http://") == -1)
          $(this).attr("src", json.baseUrl + "/" + url);
      });
      dom.find("a").each(function() {
        var url = $(this).attr("href");
        if (url.search("http://") == -1)
        {
          if (url.search("#") != 0)
            $(this).attr("href", json.baseUrl + "/" + url);
        }
        else
        {
          if (url.search("france-ioi.org") == -1)
            $(this).attr("target", "_blank");
        }
      });
      
      var tagSelected = "<" + Language.baliseFromLanguage(sSelectedLanguage) + ">"
      
      // <c_cpp> => <c> or <cpp>
      var tagReplace = "<cpp>";
      if (["<c>", "<cpp>"].indexOf(tagSelected) != -1)
        tagReplace = tagSelected;
      dom.find("c_cpp").replaceWith(function() {
        return $(tagReplace).append($(this).html());
      });
      
      // <java_jvs> => <java> or <javascool>
      var tagReplace = "<java>";
      if (["<java>", "<javascool>"].indexOf(tagSelected) != -1)
        tagReplace = tagSelected;
      dom.find("java_jvs").replaceWith(function() {
        return $(tagReplace).append($(this).html());
      });
      
      // <jvs> => <javascool>
      dom.find("jvs").replaceWith(function() {
        return $("<javascool>").append($(this).html());
      });
      
      // <select_prog_tag>
      for (var tag in tags)
        if ("<" + tag + ">" != tagSelected)
          dom.find("select_prog_tag " + tag).remove();
      
      // <specific>
      dom.find("specific").each(function() {
        var tab = $(this).attr("lang").split(",");
        for (var i=0; i<tab.length; i++)
        {
          tab[i] = tab[i].trim();
          if (tab[i] == "jvs")
            tab[i] = "javascool";
        }
        if (tab.indexOf(Language.baliseFromLanguage(sSelectedLanguage)) == -1)
          $(this).remove();
      });
      
      // <lang> => <pre class="brush:lang">
      for (var tag in tags)
      {
        dom.find(tag).replaceWith(function() {
          var pre = $("<pre class='brush:" + tags[tag] + "'></pre>"); // ;class-name:notranslate
          return pre.append($(this).html());
        });
      }
      
      return dom.html();
    }
    
    function getSubject()
    {
      function splitStatement(s)
      {
        var result = {
          statement : "",
          constraints : "",
          input : "",
          output : "",
          comments : ""
        };
        
        var lines = s.split("\n");
        var category = ""
        for (var i=0; i<lines.length; i++)
        {
          var tmp = lines[i].match(/^\s*<h1>(.*)<\/h1>(.*)$/i);
          if (tmp != null)
          {
            category = tmp[1].toLowerCase();
            result[category] += tmp[2];
          }
          else
          {
            if (category != "")
              result[category] += lines[i] + "\n";
          }
        }
        
        return result;
      }
      
      function getLimits()
      {
        var time = "";
        var memory = "";
          
        if (typeof FIOITaskMetaData.limits != "undefined")
        {
          if (typeof FIOITaskMetaData.limits.time[sSelectedLanguage] != "undefined")
            time = translate("time", json.language).capitalize() + " : " + FIOITaskMetaData.limits.time[sSelectedLanguage] + "s<br />";
          else if (typeof FIOITaskMetaData.limits.time["*"] != "undefined")
            time = translate("time", json.language).capitalize() + " : " + FIOITaskMetaData.limits.time["*"] + "s<br />";
          
          if (typeof FIOITaskMetaData.limits.memory[sSelectedLanguage] != "undefined")
            memory = translate("memory", json.language).capitalize() + " : " + FIOITaskMetaData.limits.memory[sSelectedLanguage] + "ko<br />";
          else if (typeof FIOITaskMetaData.limits.memory["*"] != "undefined")
            memory = translate("memory", json.language).capitalize() + " : " + FIOITaskMetaData.limits.memory["*"] + "ko<br />";
        }
        
        return time + memory;
      }
      
      function getTests()
      {
        var result = "";
        
        $("#tests").children().each( function() {
          result += translate("input", json.language).capitalize() + " :<br />";
          result += $(this.children[0]).html();
          result += "<br />";
          result += translate("output", json.language).capitalize() + " :<br />";
          result += $(this.children[1]).html();
          result += "<br />"
        });
        
        return result;
      }
      
      var s = $("#task").text();
      var categories = splitStatement(s);
      categories.limits = getLimits();
      categories.tests = getTests();
      
      var result = "";
      
      result += transformHtml(addSources(categories.statement));
      
      if (categories.limits != "")
      {
        result += "<h3>" + translate("limits", json.language).toUpperCase() + "</h3>";
        result += categories.limits;
      }
      
      if (categories.constraints != "")
      {
        result += "<h3>" + translate("constraints", json.language).toUpperCase() + "</h3>";
        result += transformHtml(categories.constraints);
      }
      
      if (categories.input != "")
      {
        result += "<h3>" + translate("input", json.language).toUpperCase() + "</h3>";
        result += transformHtml(categories.input);
      }
      
      if (categories.output != "")
      {
        result += "<h3>" + translate("output", json.language).toUpperCase() + "</h3>";
        result += transformHtml(categories.output);
      }
      
      if (categories.tests != "")
      {
        result += "<h3>" + translate("examples", json.language).toUpperCase() + "</h3>";
        result += categories.tests;
      }
      
      if (categories.comments != "")
      {
        result += "<h3>" + translate("comments", json.language).toUpperCase() + "</h3>";
        result += transformHtml(addSources(categories.comments));
      }
      
      return result;
    }
    
    function getAnimation()
    {
      if ($("#animation").length)
        return transformHtml(addSources($("#animation").text()));
      else
        return "";
    }
    
    function getHints()
    {
      if ($("#hints").length)
        return transformHtml(addSources($("#hints").text()));
      else
        return "";
    }
    
    function getSolution()
    {
      if ($("#solution").length)
        return transformHtml(addSources($("#solution").text()));
      else
        return "";
    }
    
    $("#view-task").html(getSubject());
    $("#view-animation").html(getAnimation());
    $("#view-hints").html(getHints());
    $("#view-solution").html(getSolution());
    
    initCodeTabs();
    
    SyntaxHighlighter.defaults.toolbar  = false;
    SyntaxHighlighter.defaults.gutter   = false;
    SyntaxHighlighter.highlight();
    
    callback();
  }
  
  var initLoadAjax = function()
  {
    var tests = $('<script id="tests" type="text/template"></script>');
    
    var waiting = 1;
    function doneCB(x) { return function(data) { x.text(data) } }
    function failCB(x) { return function() { alert("Unable to load '" + x + "'") } }
    function alwaysCB()
    {
      waiting--;
      if (waiting == 0)
        initViews();
    }
    
    if (FIOITaskMetaData.tests != null)
    for (var i=0; i<FIOITaskMetaData.tests.length; i++)
    {
      var act = $("<div></div>");
      var input = $("<pre></pre>");
      var output = $("<pre></pre>");
      
      waiting += 2;
      $.get("tests/" + FIOITaskMetaData.tests[i] + ".in")
       .done(doneCB(input))
       .fail(failCB("test/" + FIOITaskMetaData.tests[i] + ".in"))
       .always(alwaysCB);
      $.get("tests/" + FIOITaskMetaData.tests[i] + ".out")
       .done(doneCB(output))
       .fail(failCB("test/" + FIOITaskMetaData.tests[i] + ".out"))
       .always(alwaysCB);
      
      act.append($("<div></div>").append(input));
      act.append($("<div></div>").append(output));
      tests.append(act);
    }
    
    $(document.body).append(tests);
    
    var sources = $('<script id="sources" type="text/template"></script>');
    
    if (FIOITaskMetaData.sources != null)
    for (var iGroup in FIOITaskMetaData.sources)
    {
      var tmp = $("<div id='sources-" + iGroup + "'></div>");
      
      for (var iSource=0; iSource<FIOITaskMetaData.sources[iGroup].length; iSource++)
      {
        var tab = FIOITaskMetaData.sources[iGroup][iSource].split(".");
        var lang = Language.languageFromExtension(tab[tab.length-1]);
        var id = FIOITaskMetaData.sources[iGroup][iSource];
        var act = $("<" + Language.baliseFromLanguage(lang) + "></" + Language.baliseFromLanguage(lang) + ">");
        
        waiting++;
        $.get("sources/" + iGroup + "-" + id)
         .done(doneCB(act))
         .fail(failCB("sources/" + iGroup + "-" + id))
         .always(alwaysCB);
        
        tmp.append($("<div lang='" + lang + "'></div>").html(act));
      }
      
      sources.append(tmp);
    }
    
    $(document.body).append(sources);
    
    alwaysCB();
  }
  
  var initLoadIframe = function()
  {
    var tests = $('<script id="tests" type="text/template"></script>');
    
    if (FIOITaskMetaData.tests != null)
    for (var i=0; i<FIOITaskMetaData.tests.length; i++)
    {
      var tmp = $("<div></div>");
      tmp.append("<div><iframe src='tests/" + FIOITaskMetaData.tests[i] + ".in'></iframe></div>");
      tmp.append("<div><iframe src='tests/" + FIOITaskMetaData.tests[i] + ".out'></iframe><div>");
      tests.append(tmp);
    }
    
    $(document.body).append(tests);
    
    var sources = $('<script id="sources" type="text/template"></script>');
    
    if (FIOITaskMetaData.sources != null)
    for (var iGroup in FIOITaskMetaData.sources)
    {
      var tmp = $("<div id='sources-" + iGroup + "'></div>");
      
      for (var iSource=0; iSource<FIOITaskMetaData.sources[iGroup].length; iSource++)
      {
        var tab = FIOITaskMetaData.sources[iGroup][iSource].split(".");
        var lang = Language.languageFromExtension(tab[tab.length-1]);
        var id = FIOITaskMetaData.sources[iGroup][iSource];
        tmp.append("<div lang='" + lang + "'>" +
                   "<iframe src='sources/" + iGroup + "-" + id + "' width='600' height='400'>" +
                   "</iframe>" +
                   "</div>");
      }
      
      sources.append(tmp);
    }
    
    $(document.body).append(sources);
    
    initViews();
  }
  
  if (window.location.href.search("http://") == 0 || window.location.href.search("https://") == 0)
    initLoadAjax();
  else
    initLoadIframe();
}
