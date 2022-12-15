MathJax.Hub.Register.StartupHook("End",function () {
  var sidescrollElements = document.getElementsByClassName("sidescroll");
  for(var i = 0; i < sidescrollElements.length; i++) {
    var el = sidescrollElements[i];
    el.style = 'width: auto; overflow-x: scroll; overflow-y: hidden;';
    console.log("running callback for " + el);
  }
});

