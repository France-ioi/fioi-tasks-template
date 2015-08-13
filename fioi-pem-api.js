(function() {
'use strict';

var task = {};

task.getViews = function(callback) {
    // all fioi tasks have the same views
    var views = {
        task: {},
        solution: {},
        hints : {},
        forum : {requires: "task"},
        editor : {}
    };
    callback(views);
};

task.showViews = function(views, callback)
{
   $.each(['task', 'hints', 'solution'], function(i, view) {
      if (view in views)
        $(view).show();
      else
        $(view).hide();
   });
   callback();
};

task.getMetaData = function(callback) {
   callback(PEMTaskMetaData);
};

window.task = task;

console.error(task);

})();
