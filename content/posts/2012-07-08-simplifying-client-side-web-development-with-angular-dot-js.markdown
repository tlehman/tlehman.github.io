---
categories:
- javascript
- google
comments: true
date: 2012-07-08T00:00:00Z
title: Simplifying client-side web development with Angular.js
url: /2012/07/08/simplifying-client-side-web-development-with-angular-dot-js/
---

For dealing with client-side web development there are a lot of ways to bind data to elements to HTML. However, none have stood out quite as well as [Angular.js](http://angular.js) from Google. There is a [good screencast](http://www.youtube.com/watch?v=uFTFsKmkQnQ&feature=player_embedded) giving a side-by-side comparison of a "hello name" app done in jQuery and then in Angular.

I have been meaning to play around with this library for a while, but I didn't have any unique ways of applying it. However, just today, my girlfriend suggested that we try to Latinize our names, similar to how [Carl Linnaeus](http://en.wikipedia.org/wiki/Carl_Linnaeus) did. I thought it was a cool idea, and assumed that someone had already made an app that did just that. It turns out that no one has, however, I did find [this article](http://www.ehow.com/how_7378149_convert-english-first-name-latin.html) on ehow.com on how to turn an english first name to Latin. The rules are simple, but instead of spelling them out here, I'm going to link to the app that I made, and then dissect it. The dissection will show a little bit of Angular.js in action.

<a href="/apps/latinizer" target="_new">Heres the app.</a>

This app had to respond to the events triggered by changing the text in the text box, and also to the changing radio button. If I was using something like jQuery, I'd have to rig up handlers for all those events. Also, any time the name or the gender changes, I'd have to update the label that displayed the latinized name. This is not hard, but it does get tedious, especially for larger apps.

The way Angular handles this is by abstracting away all of the event handling, and making it so that the developer (me) can just bind a label to an object, and then bind controls to an object, and trigger all the updates automatically.

Using the Latinizer example, let's start with the view:
``` html
<!doctype html>
<html ng-app>
<head>
    <script src="http://code.angularjs.org/angular-1.0.1.min.js" type="text/javascript"></script>
    <script src="latinizer.js" type="text/javascript"></script>
    <title>Convert English name into Latin</title>
</head>
<body>
    <div ng-controller="LatinizerCtrl">
        <label>First Name:</label>
        <input type="text" ng-model="person.firstName" placeholder="Enter First Name">
        <input type="radio" name="gender" value="Male" ng-model="person.gender">Male
        <input type="radio" name="gender" value="Female" ng-model="person.gender">Female
        <br>
        <br>
        <h1>{{latinizeFirstName(person)}}</h1>
    </div>

    Note: the rules being used here are from 
		<a href="http://www.ehow.com/how_7378149_convert-english-first-name-latin.html">this page</a>.
</html>
```

This is just an ordinary html file that includes the angular.js library, and some of the elements have "ng-something" attributes. Those attributes tell angular where to get and set data.

Note the "ng-controller" element, it tells angular to use the controller named "LatinizerCtrl", that is defined in the following javascript file:
``` javascript
		function LatinizerCtrl($scope) {
    $scope.person = {
        firstName:"",
        gender:""
    };

    $scope.latinizeFirstName = function(person) {
        var latinFirstName = person.firstName;

        if(person.gender == "Male") {
            latinFirstName += "us";
        } else if(person.gender == "Female") {
            if(person.firstName.match(/y$/)) {
                latinFirstName = latinFirstName.replace(/y$/, "i");
            }
            latinFirstName += "a";
        }

        if(person.firstName == "") {
            latinFirstName = "";
        }
        return latinFirstName;
    };
}
```

The first part of the controller sets up the `person` model, it has a first name and a gender, then the `latinizerFirstName` function takes the person, and based on their gender, gives them the appropriate latin first name.

I have not been able to find rules for converting last names to Latin. I have found large lists and tables of Latin surnames, but that is beyond the scope of this little exploration. Perhaps in the future I will make a server-side component, with a key-value store to convert surnames to Latin.
