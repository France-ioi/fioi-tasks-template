(function() {
'use strict';

var debug = false;

var languageFromFilename = function(filename) {
  var ext = filename.substr(filename.lastIndexOf('.') + 1);
  switch (ext) {
   case "cpp" : return "C++";
   case "c" : return "C";
   case "pas" : return "Pascal";
   case "ml" : return "OCaml";
   case "java" : return "Java";
   case "jvs" : return "JavaScool";
   case "py" : return "Python";
   default : alert("Unknown extension '" + ext + "'");
 }
};

// fetches all the resources from FIOITaskMetaData into PEMInstallationAPIObject
// calls callback when done
function fetchResources(FIOITaskMetaData, callback) {
    var waiting = 1; // number of ajax fetches waiting
    // the result is an object containing the arrays to concat to 
    var groupsResources = {task: {}, solution: {}}; // keep track of group -> resource mapping, to add the answerForms
    // type is 'task' or 'solution'
    function sourceDone(groupName, sourceFile, type) {
      return function(answer) {
         console.log('got '+answer);
         var groupResource = groupsResources[type][groupName];
         if (!groupResource) {
            groupResource = {type: 'answer', name: groupName, answerForms: []};
            groupsResources[type][groupName] = groupResource;
            PEMInstallationAPIObject[type].push(groupResource);
         }
         console.log(groupsResources);
         groupResource.answerForms.push({
            params: {sLangProg: languageFromFilename(sourceFile)},
            answer: answer
         });
      };
    }
    var samplesResources = {task: {}, solution: {}}; // keep track of test name -> resource mapping
    // type is 'task' or 'solution'
    // direction is 'in' or 'out'
    function sampleDone(sampleName, type, direction) {
      return function(sample) {
         var sampleResource = samplesResources[type][sampleName];
         if (!sampleResource) {
            sampleResource = {type: 'sample', name: sampleName};
            samplesResources[type][sampleName] = sampleResource;
            PEMInstallationAPIObject[type].push(sampleResource);
         }
         sampleResource[direction] = sample;
      };
    }
    function fetchFail(filename) { return function() { alert("Unable to load '" + filename + "'"); }; }
    function fetchAlways()
    {
      waiting = waiting -1;
      if (!waiting)
        callback();
    }
    
    var i;
    if (FIOITaskMetaData.taskSamples) {
       for (i=0; i<FIOITaskMetaData.taskSamples.length; i++)
       {
         waiting += 2;
         $.get("tests/" + FIOITaskMetaData.taskSamples[i] + ".in")
          .done(sampleDone(FIOITaskMetaData.taskSamples[i], 'task', 'in'))
          .fail(fetchFail("test/" + FIOITaskMetaData.taskSamples[i] + ".in"))
          .always(fetchAlways);
         $.get("tests/" + FIOITaskMetaData.taskSamples[i] + ".out")
          .done(sampleDone(FIOITaskMetaData.taskSamples[i], 'task', 'out'))
          .fail(fetchFail("test/" + FIOITaskMetaData.taskSamples[i] + ".out"))
          .always(fetchAlways);
       }
    }
    if (FIOITaskMetaData.graderSamples) {
       for (i=0; i<FIOITaskMetaData.graderSamples.length; i++)
       {
         waiting += 2;
         $.get("tests/" + FIOITaskMetaData.graderSamples[i] + ".in")
          .done(sampleDone(FIOITaskMetaData.graderSamples[i], 'grader', 'in'))
          .fail(fetchFail("test/" + FIOITaskMetaData.graderSamples[i] + ".in"))
          .always(fetchAlways);
         $.get("tests/" + FIOITaskMetaData.graderSamples[i] + ".out")
          .done(sampleDone(FIOITaskMetaData.graderSamples[i], 'grader', 'out'))
          .fail(fetchFail("test/" + FIOITaskMetaData.graderSamples[i] + ".out"))
          .always(fetchAlways);
       }
    }
    var groupName, iSource, fileName;
    if (FIOITaskMetaData.taskSources) {
       for (groupName in FIOITaskMetaData.taskSources)
       {
         for (iSource=0; iSource<FIOITaskMetaData.taskSources[groupName].length; iSource++)
         {
           waiting++;
           fileName = FIOITaskMetaData.taskSources[groupName][iSource];
           $.get("sources/" + groupName + "-" + fileName)
            .done(sourceDone(groupName, fileName, 'task'))
            .fail(fetchFail("sources/" + groupName + "-" + fileName))
            .always(fetchAlways);
         }
       }
   }
    if (FIOITaskMetaData.solutionSources) {
       for (groupName in FIOITaskMetaData.solutionSources)
       {
         for (iSource=0; iSource<FIOITaskMetaData.solutionSources[groupName].length; iSource++)
         {
           waiting++;
           fileName = FIOITaskMetaData.taskSources[groupName][iSource];
           $.get("sources/" + groupName + "-" + fileName)
            .done(sourceDone(groupName, fileName, 'solution'))
            .fail(fetchFail("sources/" + groupName + "-" + fileName))
            .always(fetchAlways);
         }
       }
   }
   fetchAlways();
}

var task = {};

task.getMetaData = function(callback)
{
  if (typeof PEMInstallationAPIObject === 'undefined')
    PEMInstallationAPIObject = {};
  callback(PEMInstallationAPIObject);
};

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
  
  if (typeof PEMInstallationAPIObject == 'undefined')
    PEMInstallationAPIObject = {};
  if (typeof PEMInstallationAPIObject.language == 'undefined')
    PEMInstallationAPIObject.language = "fr";
  if (typeof PEMInstallationAPIObject.baseUrl == 'undefined')
    PEMInstallationAPIObject.baseUrl = "";
  
  var initViews = function()
  {
    if (!$("#views").length)
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
          $(this).attr("src", PEMInstallationAPIObject.baseUrl + "/" + url);
      });
      dom.find("a").each(function() {
        var url = $(this).attr("href");
        if (url.search("http://") == -1)
        {
          if (url.search("#") !== 0)
            $(this).attr("href", PEMInstallationAPIObject.baseUrl + "/" + url);
        }
        else
        {
          if (url.search("france-ioi.org") == -1)
            $(this).attr("target", "_blank");
        }
      });
      
      var tagSelected = "<" + Language.baliseFromLanguage(sSelectedLanguage) + ">";
      
      // <c_cpp> => <c> or <cpp>
      var tagReplace = "<cpp>";
      if (["<c>", "<cpp>"].indexOf(tagSelected) != -1)
        tagReplace = tagSelected;
      dom.find("c_cpp").replaceWith(function() {
        return $(tagReplace).append($(this).html());
      });
      
      // <java_jvs> => <java> or <javascool>
      tagReplace = "<java>";
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
      
      var domReplacerFactory = function(tag) {
         return function() {
          var pre = $("<pre class='brush:" + tags[tag] + "'></pre>"); // ;class-name:notranslate
          return pre.append($(this).html());
        };
      };
      
      // <lang> => <pre class="brush:lang">
      for (tag in tags)
      {
        dom.find(tag).replaceWith(domReplacerFactory(tag));
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
        var category = "";
        for (var i=0; i<lines.length; i++)
        {
          var tmp = lines[i].match(/^\s*<h1>(.*)<\/h1>(.*)$/i);
          if (tmp)
          {
            category = tmp[1].toLowerCase();
            result[category] += tmp[2];
          }
          else
          {
            if (category)
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
            time = translate("time", PEMInstallationAPIObject.language).capitalize() + " : " + FIOITaskMetaData.limits.time[sSelectedLanguage] + "s<br />";
          else if (typeof FIOITaskMetaData.limits.time["*"] != "undefined")
            time = translate("time", PEMInstallationAPIObject.language).capitalize() + " : " + FIOITaskMetaData.limits.time["*"] + "s<br />";
          
          if (typeof FIOITaskMetaData.limits.memory[sSelectedLanguage] != "undefined")
            memory = translate("memory", PEMInstallationAPIObject.language).capitalize() + " : " + FIOITaskMetaData.limits.memory[sSelectedLanguage] + "ko<br />";
          else if (typeof FIOITaskMetaData.limits.memory["*"] != "undefined")
            memory = translate("memory", PEMInstallationAPIObject.language).capitalize() + " : " + FIOITaskMetaData.limits.memory["*"] + "ko<br />";
        }
        
        return time + memory;
      }
      
      function getTests()
      {
        var result = "";
        
        $("#tests").children().each( function() {
          result += translate("input", PEMInstallationAPIObject.language).capitalize() + " :<br />";
          result += $(this.children[0]).html();
          result += "<br />";
          result += translate("output", PEMInstallationAPIObject.language).capitalize() + " :<br />";
          result += $(this.children[1]).html();
          result += "<br />";
        });
        
        return result;
      }
      
      var s = $("#task").text();
      var categories = splitStatement(s);
      categories.limits = getLimits();
      categories.tests = getTests();
      
      var result = "";
      
      result += transformHtml(addSources(categories.statement));
      
      if (categories.limits)
      {
        result += "<h3>" + translate("limits", PEMInstallationAPIObject.language).toUpperCase() + "</h3>";
        result += categories.limits;
      }
      
      if (categories.constraints)
      {
        result += "<h3>" + translate("constraints", PEMInstallationAPIObject.language).toUpperCase() + "</h3>";
        result += transformHtml(categories.constraints);
      }
      
      if (categories.input)
      {
        result += "<h3>" + translate("input", PEMInstallationAPIObject.language).toUpperCase() + "</h3>";
        result += transformHtml(categories.input);
      }
      
      if (categories.output)
      {
        result += "<h3>" + translate("output", PEMInstallationAPIObject.language).toUpperCase() + "</h3>";
        result += transformHtml(categories.output);
      }
      
      if (categories.tests)
      {
        result += "<h3>" + translate("examples", PEMInstallationAPIObject.language).toUpperCase() + "</h3>";
        result += categories.tests;
      }
      
      if (categories.comments)
      {
        result += "<h3>" + translate("comments", PEMInstallationAPIObject.language).toUpperCase() + "</h3>";
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
  };
  
  var initLoadAjax = function()
  {
    fetchResources(FIOITaskMetaData, function() {
      console.log(PEMInstallationAPIObject);
    });
    var tests = $('<script id="tests" type="text/template"></script>');
    var waiting = 1;
    function doneCB(x) { return function(data) { x.text(data); }; }
    function failCB(x) { return function() { alert("Unable to load '" + x + "'"); }; }
    function alwaysCB()
    {
      waiting--;
      if (!waiting)
        initViews();
    }
    
    if (FIOITaskMetaData.tests)
    for (var i=0; i<FIOITaskMetaData.tests.length; i++)
    {
      var actTest = $("<div></div>");
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
      
      actTest.append($("<div></div>").append(input));
      actTest.append($("<div></div>").append(output));
      tests.append(actTest);
    }
    
    $(document.body).append(tests);
    
    var sources = $('<script id="sources" type="text/template"></script>');
    
    if (FIOITaskMetaData.sources)
    for (var iGroup in FIOITaskMetaData.sources)
    {
      var tmp = $("<div id='sources-" + iGroup + "'></div>");
      
      for (var iSource=0; iSource<FIOITaskMetaData.sources[iGroup].length; iSource++)
      {
        var tab = FIOITaskMetaData.sources[iGroup][iSource].split(".");
        var lang = Language.languageFromExtension(tab[tab.length-1]);
        var id = FIOITaskMetaData.sources[iGroup][iSource];
        var actSource = $("<" + Language.baliseFromLanguage(lang) + "></" + Language.baliseFromLanguage(lang) + ">");
        
        waiting++;
        $.get("sources/" + iGroup + "-" + id)
         .done(doneCB(actSource))
         .fail(failCB("sources/" + iGroup + "-" + id))
         .always(alwaysCB);
        
        tmp.append($("<div lang='" + lang + "'></div>").html(actSource));
      }
      
      sources.append(tmp);
    }
    
    $(document.body).append(sources);
    
    alwaysCB();
  };
  
  var initLoadIframe = function()
  {
    var tests = $('<script id="tests" type="text/template"></script>');
    
    if (FIOITaskMetaData.tests) {
       for (var i=0; i<FIOITaskMetaData.tests.length; i++)
       {
         var tmpTest = $("<div></div>");
         tmpTest.append("<div><iframe src='tests/" + FIOITaskMetaData.tests[i] + ".in'></iframe></div>");
         tmpTest.append("<div><iframe src='tests/" + FIOITaskMetaData.tests[i] + ".out'></iframe><div>");
         tests.append(tmpTest);
       }
    }
    
    $(document.body).append(tests);
    
    var sources = $('<script id="sources" type="text/template"></script>');
    
    if (FIOITaskMetaData.sources) {
       for (var iGroup in FIOITaskMetaData.sources)
       {
         var tmpSource = $("<div id='sources-" + iGroup + "'></div>");
         
         for (var iSource=0; iSource<FIOITaskMetaData.sources[iGroup].length; iSource++)
         {
           var tab = FIOITaskMetaData.sources[iGroup][iSource].split(".");
           var lang = Language.languageFromExtension(tab[tab.length-1]);
           var id = FIOITaskMetaData.sources[iGroup][iSource];
           tmpSource.append("<div lang='" + lang + "'>" +
                      "<iframe src='sources/" + iGroup + "-" + id + "' width='600' height='400'>" +
                      "</iframe>" +
                      "</div>");
         }
         
         sources.append(tmpSource);
       }
    }
    
    $(document.body).append(sources);
    initViews();
  };
  
  if (window.location.href.search("http://") === 0 || window.location.href.search("https://") === 0)
    initLoadAjax();
  else
    initLoadIframe();
};

window.task = task;

})();
